declare module "react-native-get-sms-android";

import { PermissionsAndroid } from "react-native";
import SmsAndroid from "react-native-get-sms-android";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { submitSmsForExtraction } from "./expenseService";

const SYNC_BOOKMARK_KEY = "@last_sms_sync_time";

export const syncBankMessages = async (): Promise<number> => {
  try {
    // 1. Ask Android for permission to read the inbox
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: "Expense Tracker SMS Permission",
        message: "We need access to read your bank SMS to automate your expenses.",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      }
    );

    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      console.log("SMS permission denied");
      return 0;
    }

    // 2. Get the time we last checked (Default to 24 hours ago if first run)
    const lastSyncString = await AsyncStorage.getItem(SYNC_BOOKMARK_KEY);
    const minDate = lastSyncString ? parseInt(lastSyncString) : Date.now() - 24 * 60 * 60 * 1000;

    // 3. Setup the strict filter for the Android OS
    const filter = {
      box: "inbox",
      minDate: minDate,
      maxCount: 20, 
    };

    return new Promise((resolve) => {
      SmsAndroid.list(
        JSON.stringify(filter),
        (fail: any) => {
          console.log("Failed to fetch SMS: ", fail);
          resolve(0);
        },
        async (count: number, smsList: string) => {
          const messages = JSON.parse(smsList);
          let processedCount = 0;

          // 4. Look for bank keywords in the messages
          for (const msg of messages) {
            const body = msg.body.toLowerCase();
            if (body.includes("debited") || body.includes("spent") || body.includes("inr")) {
              
              // 5. Send to Spring Boot with the EXACT Android timestamp!
              await submitSmsForExtraction(msg.body, msg.date);
              processedCount++;
            }
          }

          // 6. Update our bookmark to right now so we never read these again
          if (messages.length > 0) {
             await AsyncStorage.setItem(SYNC_BOOKMARK_KEY, Date.now().toString());
          }
          
          resolve(processedCount);
        }
      );
    });
  } catch (err) {
    console.error("SMS Sync Error:", err);
    return 0;
  }
};