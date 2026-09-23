import { useRef, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { brand, BrandText } from "./brand";

const publicFeedback = new Set([
  "El servicio de Mi Saluteca no está configurado.",
  "No hay conexión con Mi Saluteca. Volvé a intentar.",
  "No se pudo confirmar el inicio de sesión.",
  "No se pudo iniciar sesión.",
  "No se pudo recuperar la sesión.",
  "Iniciá sesión nuevamente.",
  "Sesión cerrada en este dispositivo. No se pudo confirmar la revocación en el servidor.",
]);

// Intent: encontrar la propia carpeta clínica con calma. Azul de marca y papel blanco.
// Depth: papel sólido y control outlined; Inter local, spacing 4 pt, texto escalable.
export function LoginScreen({ login, busy, message, legalOrigin }: {
  login?: () => Promise<void | boolean>; busy: boolean; message: string | null; legalOrigin: string | null;
}) {
  const pending = useRef(false);
  const [signingIn, setSigningIn] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const feedback = message ? (publicFeedback.has(message) ? message : "No pudimos iniciar sesión. Volvé a intentar.") : actionError;
  const start = async () => {
    if (!login || busy || pending.current) return;
    pending.current = true;
    setSigningIn(true);
    setActionError(null);
    setCancelled(false);
    try { if (await login() === false) setCancelled(true); }
    catch { setActionError("No pudimos conectar tu cuenta. Volvé a intentar."); }
    finally { pending.current = false; setSigningIn(false); }
  };
  const legal = async (path: string) => {
    if (!legalOrigin) return;
    try { await Linking.openURL(`${legalOrigin}${path}`); }
    catch { setActionError("No pudimos abrir la página. Volvé a intentar."); }
  };
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.identity}>
      <Image source={require("../assets/brand.png")} style={styles.logo} accessibilityLabel="Mi Saluteca" />
      <BrandText style={styles.tagline}>Tu salud, siempre con vos.</BrandText>
    </View>
    <View style={styles.access}>
      <BrandText accessibilityRole="header" style={styles.heading}>Tus estudios, en un solo lugar.</BrandText>
      <BrandText style={styles.description}>Accedé a tu historial médico de forma simple y segura.</BrandText>
      <Pressable accessibilityRole="button" accessibilityLabel="Acceder con Google" accessibilityState={{ disabled: !login || busy || signingIn, busy: signingIn }} disabled={!login || busy || signingIn} onPress={() => void start()} style={({ pressed }) => [styles.google, pressed && styles.pressed, (!login || busy || signingIn) && styles.disabled]}>
        {signingIn ? <ActivityIndicator color={brand.colors.blue} /> : <GoogleMark />}
        <BrandText style={styles.googleLabel}>{signingIn ? "Cargando..." : "Acceder con Google"}</BrandText>
      </Pressable>
      {feedback ? <BrandText accessibilityRole="alert" style={styles.error}>{feedback}</BrandText> : null}
      {busy && !signingIn ? <View style={styles.restoring}><ActivityIndicator color={brand.colors.blue} /><BrandText style={styles.description}>Restaurando tu sesión…</BrandText></View> : null}
      {cancelled && !message ? <BrandText accessibilityLiveRegion="polite" style={styles.description}>Inicio de sesión cancelado. Podés volver a intentar.</BrandText> : null}
      <BrandText style={styles.legalCopy}>Al continuar con Google aceptás nuestros</BrandText>
      <View style={styles.links}>
        <Pressable accessibilityRole="link" accessibilityLabel="Términos" disabled={!legalOrigin} onPress={() => void legal("/terminos")} style={styles.link}><BrandText style={styles.linkText}>Términos</BrandText></Pressable>
        <BrandText style={styles.and}>y</BrandText>
        <Pressable accessibilityRole="link" accessibilityLabel="Política de Privacidad" disabled={!legalOrigin} onPress={() => void legal("/privacidad")} style={styles.link}><BrandText style={styles.linkText}>Política de Privacidad</BrandText></Pressable>
      </View>
    </View>
  </ScrollView></SafeAreaView>;
}

function GoogleMark() {
  return <Svg width={20} height={20} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </Svg>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: brand.colors.surface },
  content: { flexGrow: 1, justifyContent: "center", padding: 28, paddingVertical: 48, gap: 48 },
  identity: { alignItems: "center", gap: 12 },
  logo: { width: 264, height: 104, resizeMode: "contain" },
  tagline: { fontSize: 16, textAlign: "center" },
  access: { width: "100%", maxWidth: 440, alignSelf: "center", gap: 16 },
  heading: { fontFamily: "Inter_600SemiBold", color: brand.colors.navy, fontSize: 28, lineHeight: 36, textAlign: "center" },
  description: { fontSize: 16, lineHeight: 24, textAlign: "center", marginBottom: 12 },
  google: { minHeight: 52, borderWidth: 1, borderColor: brand.colors.border, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, padding: 16 },
  googleLabel: { fontFamily: "Inter_500Medium", color: brand.colors.ink, fontSize: 16, lineHeight: 24, flexShrink: 1 },
  pressed: { backgroundColor: brand.colors.control }, disabled: { opacity: 0.6 },
  error: { color: brand.colors.danger, fontSize: 16 },
  legalCopy: { fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 16 },
  links: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", columnGap: 4 },
  link: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  linkText: { color: brand.colors.navy, textDecorationLine: "underline", fontFamily: "Inter_600SemiBold", fontSize: 13, lineHeight: 20 },
  and: { fontSize: 13 },
  restoring: { gap: 8, alignItems: "center" },
});
