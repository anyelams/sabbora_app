// app/index.js
import { Redirect } from "expo-router";
import "react-native-gesture-handler";

export default function Index() {
  return <Redirect href="/welcome" />;
}
