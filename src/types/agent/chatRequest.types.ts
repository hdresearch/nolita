export type ChatRequestRole = "system" | "user" | "assistant" | "tool";

export type ChatContentText = {
  type: "text";
  text: string;
};

export type ChatContentImageURL = {
  type: "image_url";
  image_url: string;
};

export type ChatContentType = ChatContentText | ChatContentImageURL;
