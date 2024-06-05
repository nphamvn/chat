import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useAuth0 } from "react-native-auth0";
import { useRealm } from "@realm/react";
import { MessageSchema as MessageSchema } from "../../schemas/MessageSchema";
import { BSON } from "realm";
import { ConversationSchema } from "../../schemas/ConversationSchema";
import { UserSchema } from "../../schemas/UserSchema";

export default function ChatScreen() {
  const { user } = useAuth0();
  const realm = useRealm();
  const { cIdParam, uId } = useLocalSearchParams<{
    cIdParam?: string;
    uId?: string;
  }>();

  const [conv, setConv] = useState<ConversationSchema>();

  useEffect(() => {
    if (cIdParam) {
      const localConv = realm.objectForPrimaryKey(
        ConversationSchema,
        new BSON.ObjectId(cIdParam)
      );
      if (localConv) {
        setConv(localConv);
        return;
      }
    } else {
      const localO2OConv = realm
        .objects(ConversationSchema)
        .filtered(`users[0].id = ${uId}`)[0];
      if (localO2OConv) {
        setConv(localO2OConv);
        return;
      }
    }
  }, [cIdParam, uId]);

  const [text, setText] = useState<string>("");
  const messageInputRef = useRef<TextInput>(null);

  const sendMessage = async () => {
    realm.beginTransaction();
    if (!conv) {
      if (!uId) {
        throw new Error("uId is required to create a new conversation.");
      }
      const user = realm.objectForPrimaryKey(UserSchema, uId);
      if (!user) {
        throw new Error("User not found.");
      }
      const newConv = realm.write(() => {
        return realm.create(ConversationSchema, {
          cId: new BSON.ObjectId(),
          users: [user],
        });
      });

      const newMsg = realm.write(() => {
        return realm.create(MessageSchema, {
          cId: new BSON.ObjectId(),
          conversation: conv,
          text: text,
          status: "notSent",
          createdAt: new Date(),
        });
      });

      newConv.messages.push(newMsg);

      setConv(newConv);
    } else {
      const newMsg = realm.write(() => {
        return realm.create(MessageSchema, {
          cId: new BSON.ObjectId(),
          conversation: conv,
          text: text,
          status: "notSent",
          createdAt: new Date(),
        });
      });

      conv.messages.push(newMsg);
    }

    realm.commitTransaction();
    setText("");
    messageInputRef.current?.focus();
  };
  return (
    <>
      <Stack.Screen
        options={{
          title: conv?.users.map((m) => m.fullName).join(", "),
          headerBackTitleVisible: false,
        }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
          <FlatList
            data={conv?.messages}
            renderItem={({ item }) =>
              item.sender.id === user?.sub ? (
                <View style={[styles.messageWrapper, styles.sentWrapper]}>
                  <View style={[styles.messageBubble, styles.sent]}>
                    <Text style={styles.messageText}>{item.text}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.messageWrapper}>
                  <Image
                    source={{
                      uri: conv?.users.find((m) => m.id === item.sender.id)
                        ?.picture,
                    }}
                    style={styles.userImage}
                  />
                  <View style={[styles.messageBubble, styles.received]}>
                    <Text style={styles.messageText}>{item.text}</Text>
                  </View>
                </View>
              )
            }
          ></FlatList>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={100}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View
                style={{
                  flexDirection: "row",
                }}
              >
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Type a message"
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    padding: 10,
                    borderColor: "#ccc",
                    borderRadius: 10,
                    marginRight: 10,
                  }}
                  ref={messageInputRef}
                ></TextInput>
                <Pressable style={{ margin: "auto" }} onPress={sendMessage}>
                  <Text style={{ color: "" }}>Send</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    padding: 10,
  },
  messageWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 10,
  },
  sentWrapper: {
    flexDirection: "row-reverse",
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  messageBubble: {
    padding: 15,
    borderRadius: 20,
    maxWidth: "70%",
    position: "relative",
  },
  messageText: {
    color: "#000",
  },
  sent: {
    backgroundColor: "#dcf8c6",
    alignSelf: "flex-end",
    borderTopRightRadius: 0,
  },
  received: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  tail: {
    position: "absolute",
    width: 0,
    height: 0,
  },
  sentTail: {
    top: 0,
    right: -10,
    borderLeftWidth: 10,
    borderLeftColor: "#dcf8c6",
    borderTopWidth: 10,
    borderTopColor: "transparent",
    borderBottomWidth: 10,
    borderBottomColor: "transparent",
  },
  receivedTail: {
    top: 0,
    left: -10,
    borderRightWidth: 10,
    borderRightColor: "#fff",
    borderTopWidth: 10,
    borderTopColor: "transparent",
    borderBottomWidth: 10,
    borderBottomColor: "transparent",
  },
});