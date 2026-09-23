import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { brand, BrandText } from "./brand";
import type { User } from "./session";
import { googleAvatarUrl } from "./google-avatar-url";
import { PremiumText } from "./PremiumUI";

export function GoogleAvatar({ user, size = 64, round = false, systemText = false }: { user: User | null; size?: number; round?: boolean; systemText?: boolean }) {
  const uri = googleAvatarUrl(user?.image);
  // A fresh image instance prevents earlier identity callbacks from changing this photo.
  return <AvatarImage key={JSON.stringify([user?.id ?? null, uri])} uri={uri} name={user?.name} size={size} round={round} systemText={systemText} />;
}

function AvatarImage({ uri, name, size, round, systemText }: { uri: string | null; name?: string | null; size: number; round: boolean; systemText: boolean }) {
  const [phase, setPhase] = useState<"loading" | "loaded" | "failed">("loading");
  const loaded = phase === "loaded";
  // Intent: reconocer la cuenta sin distraer de su historial. Conserva el espacio de su ficha.
  // Palette/surfaces: lavado verde y tinta azul actuales; papel sólido y recorte suave, sin elevar.
  // Typography: Inter local legible; spacing 4 pt, avatar fijo de 64 pt, nombre accesible al lado.
  const AvatarText = systemText ? PremiumText : BrandText;
  return <View style={[styles.avatar, { width:size,height:size,borderRadius:round?size/2:20 }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {!loaded ? <AvatarText style={[styles.initial, systemText && {fontFamily:undefined,fontWeight:"600",fontSize:size*0.44}]}>{name?.trim().slice(0, 1).toUpperCase() || "M"}</AvatarText> : null}
    {uri && phase !== "failed" ? <Image
      source={{ uri }}
      resizeMode="cover"
      accessible={false}
      style={[styles.photo, { width:size,height:size,opacity: loaded ? 1 : 0 }]}
      onLoad={() => setPhase((current) => current === "failed" ? current : "loaded")}
      onError={() => setPhase("failed")}
    /> : null}
  </View>;
}

const styles = StyleSheet.create({
  avatar: { width: 64, height: 64, borderRadius: 20, overflow: "hidden", backgroundColor: brand.colors.wash, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  initial: { fontFamily: "Inter_600SemiBold", fontSize: 28, color: brand.colors.navy },
  photo: { position: "absolute", width: 64, height: 64 },
});
