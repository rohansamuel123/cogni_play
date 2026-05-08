import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "../components/Header";
import CognitiveRadar from "../components/CognitiveRadar";
import ScoreRing from "../components/ScoreRing";
import API, { API_BASE_URL } from "../services/api";
import {
  CognitiveDomain,
  DOMAIN_LABELS,
  DOMAIN_COLORS,
  DOMAIN_EMOJI,
} from "../data/gameRegistry";
import {
  getCognitiveProfile,
  getGameSessions,
  CognitiveProfile,
  GameSession,
} from "../utils/scoring";

const asList = (value: any): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (value === null || value === undefined || value === "") return [];
  return [String(value)];
};

export default function CognitiveProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [childName, setChildName] = useState("");

  const [report, setReport] = useState<any>(null);
  const summaryText = report
    ? report.summary ||
      report.behavioral_summary ||
      "AI summary is being generated for this child."
    : "";

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const selectedStr = await AsyncStorage.getItem("selectedChild");
        if (!selectedStr) return;

        const child = JSON.parse(selectedStr);
        setChildName(child.name || "");
        const childId = child.child_id;

        const p = await getCognitiveProfile(childId);
        setProfile(p);
        const s = await getGameSessions(childId);
        setSessions(s.reverse()); // Most recent first

        // Try to load the latest report if it exists
        try {
          const res = await API.get(`/reports/child/${childId}`);
          if (res.data && res.data.length > 0) {
            setReport(res.data[res.data.length - 1]);
          }
        } catch (e: any) {
          if (e.response?.status !== 404) {
            console.warn("Could not load AI report:", e.message);
          }
        }
      };
      load();
    }, []),
  );

  const handleDownloadPDF = async () => {
    if (!report) return;
    const url = `${API_BASE_URL}/reports/${report.report_id}/pdf`;

    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (e: any) {
      console.error("Failed to open report PDF:", e.message || e);
    }
  };

  const domains: CognitiveDomain[] = [
    "memory",
    "attention",
    "logic",
    "processing_speed",
    "comprehension",
  ];

  const radarScores: Record<CognitiveDomain, number> = {
    memory: 0,
    attention: 0,
    logic: 0,
    processing_speed: 0,
    comprehension: 0,
  };
  profile?.domainScores.forEach((d) => {
    radarScores[d.domain] = d.score;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Cognitive Profile"
        subtitle={
          childName
            ? `${childName}'s thinking patterns`
            : "Your child's thinking patterns"
        }
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Radar Chart */}
        <View style={styles.radarCard}>
          <CognitiveRadar scores={radarScores} size={280} />
        </View>

        {/* Overall Score */}
        <View style={styles.overallCard}>
          <ScoreRing
            score={profile?.overallScore || 0}
            size={100}
            color="#FF7A00"
            label="Overall"
          />
          <View style={styles.overallStats}>
            <Text style={styles.overallTitle}>Cognitive Score</Text>
            <Text style={styles.overallDesc}>
              Based on {profile?.totalGamesPlayed || 0} game sessions
            </Text>
            <Text style={styles.totalStars}>
              Stars Earned: {profile?.totalStars || 0}
            </Text>
          </View>
        </View>

        {/* AI Analysis Result */}
        {report && (
          <View style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>🧠 AI Behavioral Analysis</Text>
              <View style={styles.readinessBadge}>
                <Text style={styles.readinessText}>
                  {report.readiness_label || report.readiness_level}
                </Text>
              </View>
            </View>

            <Text style={styles.reportSummary}>{summaryText}</Text>

            <View style={styles.reportSection}>
              <Text style={styles.subSectionTitle}>💡 Strengths</Text>
              {asList(report.strengths).map((s: string, i: number) => (
                <Text key={i} style={styles.bulletItem}>
                  • {s}
                </Text>
              ))}
            </View>

            <View style={styles.reportSection}>
              <Text style={styles.subSectionTitle}>🔍 Areas to Watch</Text>
              {asList(report.weaknesses).map((w: string, i: number) => (
                <Text key={i} style={styles.bulletItem}>
                  • {w}
                </Text>
              ))}
            </View>

            <View style={styles.recommendationBox}>
              <Text style={styles.recTitle}>🎯 Parent Recommendations</Text>
              {asList(report.recommendations).map((r: string, i: number) => (
                <Text key={i} style={styles.recText}>
                  - {r}
                </Text>
              ))}
            </View>

            <View style={styles.nextGameBox}>
              <Text style={styles.nextGameLabel}>Next Recommended Game:</Text>
              <Text style={styles.nextGameValue}>
                {(report.next_game || "next activity").replace(/-/g, " ")} (
                {report.difficulty_adjustment || "adaptive"})
              </Text>
            </View>

            <Text style={styles.autoGeneratedText}>
              This report was generated automatically from your child's latest
              gameplay data.
            </Text>

            <Pressable
              style={styles.downloadButton}
              onPress={handleDownloadPDF}>
              <Text style={styles.downloadButtonText}>
                Download Report as PDF
              </Text>
            </Pressable>
          </View>
        )}

        {/* Domain Breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>Domain Breakdown</Text>
          {domains.map((domain) => {
            const ds = profile?.domainScores.find((d) => d.domain === domain);
            const score = ds?.score || 0;
            const games = ds?.gamesPlayed || 0;
            return (
              <View key={domain} style={styles.domainItem}>
                <View style={styles.domainHeader}>
                  <Text style={styles.domainEmoji}>{DOMAIN_EMOJI[domain]}</Text>
                  <View style={styles.domainInfo}>
                    <Text
                      style={[
                        styles.domainName,
                        { color: DOMAIN_COLORS[domain] },
                      ]}>
                      {DOMAIN_LABELS[domain]}
                    </Text>
                    <Text style={styles.domainGames}>{games} sessions</Text>
                  </View>
                  <ScoreRing
                    score={score}
                    size={52}
                    strokeWidth={5}
                    color={DOMAIN_COLORS[domain]}
                    label=""
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Recent Sessions */}
        <View style={styles.historyCard}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {sessions.length === 0 && (
            <Text style={styles.emptyText}>
              No games played yet. Start your journey!
            </Text>
          )}
          {sessions.slice(0, 10).map((session, i) => (
            <View key={i} style={styles.sessionRow}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionGame}>
                  {session.gameId.replace(/-/g, " ")}
                </Text>
                <Text style={styles.sessionDate}>
                  {new Date(session.playedAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.sessionStars}>
                {[1, 2, 3].map((s) => (
                  <Text
                    key={s}
                    style={s <= session.stars ? styles.starOn : styles.starOff}>
                    ★
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF9F0" },
  scrollContent: { padding: 20 },

  radarCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#8B5A2B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F5E6D3",
  },

  overallCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#8B5A2B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F5E6D3",
  },
  overallStats: { marginLeft: 20, flex: 1 },
  overallTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2D1B0E",
    marginBottom: 4,
  },
  overallDesc: { fontSize: 13, color: "#8B7355", marginBottom: 4 },
  totalStars: { fontSize: 16, fontWeight: "700", color: "#FFB300" },

  breakdownCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#8B5A2B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F5E6D3",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2D1B0E",
    marginBottom: 16,
  },
  domainItem: { marginBottom: 16 },
  domainHeader: { flexDirection: "row", alignItems: "center" },
  domainEmoji: { fontSize: 28, marginRight: 12 },
  domainInfo: { flex: 1 },
  domainName: { fontSize: 16, fontWeight: "800" },
  domainGames: { fontSize: 12, color: "#B0A090", fontWeight: "500" },

  historyCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#8B5A2B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F5E6D3",
  },
  emptyText: {
    fontSize: 15,
    color: "#B0A090",
    textAlign: "center",
    paddingVertical: 20,
  },
  sessionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F0EB",
  },
  sessionInfo: {},
  sessionGame: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D1B0E",
    textTransform: "capitalize",
  },
  sessionDate: { fontSize: 12, color: "#B0A090", marginTop: 2 },
  sessionStars: { flexDirection: "row", gap: 2 },
  starOn: { fontSize: 16, color: "#FFB300" },
  starOff: { fontSize: 16, color: "#E0D5C8" },

  downloadButton: {
    marginTop: 16,
    backgroundColor: "#1F7A4C",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadButtonText: { fontSize: 15, fontWeight: "700", color: "#FFF" },
  autoGeneratedText: {
    fontSize: 13,
    color: "#5B5B5B",
    marginTop: 10,
    lineHeight: 19,
  },

  reportCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#2979FF",
    shadowColor: "#2979FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  reportTitle: {
    flex: 1,
    marginRight: 12,
    fontSize: 18,
    fontWeight: "800",
    color: "#2D1B0E",
  },
  readinessBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2979FF",
    maxWidth: "45%",
  },
  readinessText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2979FF",
    flexWrap: "wrap",
  },
  reportSummary: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5D4037",
    marginBottom: 20,
    fontStyle: "italic",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  reportSection: {
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D1B0E",
    marginBottom: 8,
  },
  bulletItem: {
    fontSize: 14,
    color: "#5D4037",
    marginBottom: 4,
    paddingLeft: 8,
  },
  recommendationBox: {
    backgroundColor: "#F0F7FF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#2979FF",
  },
  recTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2979FF",
    marginBottom: 8,
  },
  recText: {
    fontSize: 14,
    color: "#5D4037",
    lineHeight: 20,
    marginBottom: 4,
  },
  nextGameBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#FFF4E5",
    padding: 12,
    borderRadius: 12,
  },
  nextGameLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B5A2B",
    flex: 1,
    marginRight: 8,
  },
  nextGameValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FF7A00",
    textTransform: "capitalize",
    flex: 1,
    flexWrap: "wrap",
  },
});
