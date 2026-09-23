import { Redirect } from "expo-router";

// WebBrowser consumes the active PKCE callback. A router-delivered callback has
// no in-flight proof, so it must remain a neutral public navigation.
export default function Callback() {
  return <Redirect href="/" />;
}
