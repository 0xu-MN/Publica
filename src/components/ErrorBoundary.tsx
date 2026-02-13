import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AlertCircle } from "lucide-react-native";

interface Props {
    children: ReactNode;
    compName?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in ${this.props.compName}:`, error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <AlertCircle size={48} color="#EF4444" />
                    <Text style={styles.title}>Error Loading {this.props.compName || "Content"}</Text>
                    <Text style={styles.message}>{this.state.error?.message || "Unknown Error"}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => this.setState({ hasError: false })}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#EF4444",
        borderRadius: 8,
        margin: 10
    },
    title: {
        color: "#EF4444",
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 10
    },
    message: {
        color: "#D1D5DB",
        fontSize: 14,
        textAlign: "center",
        marginTop: 5,
        marginBottom: 20
    },
    retryButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: "#EF4444",
        borderRadius: 6
    },
    retryText: {
        color: "#FFFFFF",
        fontWeight: "bold"
    }
});
