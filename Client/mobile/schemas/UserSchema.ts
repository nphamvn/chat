import Realm, { ObjectSchema } from "realm";

export class UserSchema extends Realm.Object<UserSchema> {
  id!: string;
  fullName!: string;
  picture!: string;

  static schema: ObjectSchema = {
    name: "User",
    properties: {
      id: "string",
      fullName: "string",
      picture: "string",
      conversations: {
        type: "linkingObjects",
        objectType: "Conversation",
        property: "users",
      },
    },
    primaryKey: "id",
  };
}
