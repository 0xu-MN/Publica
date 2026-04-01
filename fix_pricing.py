import re

with open('src/components/workspace/views/PricingPage.tsx', 'r') as f:
    content = f.read()

# Add useColorScheme import
content = content.replace("import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';", 
                          "import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Platform, useColorScheme } from 'react-native';")

# Add isDark calculation
content = content.replace("const { user } = useAuth();", 
                          "const { user } = useAuth();\n    const colorScheme = useColorScheme();\n    const isDark = colorScheme === 'dark';\n")

# Provide dynamic styles object
dynamic_styles = """
    const theme = {
        bg: 'transparent',
        card: isDark ? '#0F172A' : '#FFFFFF',
        text: isDark ? '#F8FAFC' : '#0F172A',
        subtext: isDark ? '#64748B' : '#64748B',
        border: isDark ? '#1E293B' : '#E2E8F0',
        cardProText: isDark ? '#FFF' : '#0F172A',
        amount: isDark ? '#E2E8F0' : '#0F172A',
        faqQ: isDark ? '#E2E8F0' : '#1E293B',
    };
"""
content = content.replace("const monthlyPrice = 29900;", dynamic_styles + "\n    const monthlyPrice = 29900;")

# Make style injection for important color rules
content = content.replace("style={styles.container}", "style={[styles.container, { backgroundColor: theme.bg }]}")
content = content.replace("style={styles.title}", "style={[styles.title, { color: theme.text }]}")
content = content.replace("style={styles.card}", "style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}")
content = content.replace("style={[styles.card, styles.cardPro]}", "style={[styles.card, styles.cardPro, { backgroundColor: theme.card }]}")
content = content.replace("style={styles.planName}", "style={[styles.planName, { color: theme.text }]}")
content = content.replace("style={[styles.planName, styles.planNamePro]}", "style={[styles.planName, styles.planNamePro, { color: theme.cardProText }]}")
content = content.replace("style={styles.priceAmount}", "style={[styles.priceAmount, { color: theme.amount }]}")
content = content.replace("style={[styles.priceAmount, styles.priceAmountPro]}", "style={[styles.priceAmount, styles.priceAmountPro, { color: theme.cardProText }]}")
content = content.replace("style={styles.faqTitle}", "style={[styles.faqTitle, { color: theme.text }]}")
content = content.replace("style={styles.faqCard}", "style={[styles.faqCard, { backgroundColor: theme.card, borderColor: theme.border }]}")
content = content.replace("style={styles.faqQ}", "style={[styles.faqQ, { color: theme.faqQ }]}")

# FAQ max-width fixing
content = content.replace("style={styles.faqSection}", "style={[styles.faqSection, { maxWidth: 800, width: '100%', alignSelf: 'center' }]}")

with open('src/components/workspace/views/PricingPage.tsx', 'w') as f:
    f.write(content)
