
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { X, Check, Building2, Beaker, ShieldCheck, ChevronRight, Briefcase, Crown, ArrowRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProfileCard } from './ProfileCard';

interface ProfileEditPageProps {
    onClose: () => void;
    onSave: () => void;
}

// 🏢 JOB CATEGORIES HIERARCHY
const JOB_CATEGORIES: Record<string, string[]> = {
    'Economy': ['Macroeconomics', 'Stock Market', 'Venture Capital', 'Real Estate', 'Crypto/Blockchain'],
    'Science': ['Biotechnology', 'Physics', 'Chemistry', 'AI/Computer Science', 'Environmental Science'],
    'Art & Design': ['Graphic Design', 'UI/UX', 'Fine Arts', 'Media Arts'],
    'Business': ['Marketing', 'Strategy', 'Sales', 'HR', 'Management'],
    'Other': ['General', 'Student', 'Freelancer']
};

export const ProfileEditPage = ({ onClose, onSave }: ProfileEditPageProps) => {
    // 1. Profile State
    const [nickname, setNickname] = useState('');
    const [realName, setRealName] = useState('');
    const [bio, setBio] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    // Job Hierarchy State
    const [selectedCategory, setSelectedCategory] = useState<string>('Economy');
    const [selectedSubfield, setSelectedSubfield] = useState<string>('');
    const [customJob, setCustomJob] = useState(''); // Fallback or override

    // 2. Verification State
    const [businessNum, setBusinessNum] = useState('');
    const [researcherId, setResearcherId] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    // 3. Load Data
    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const stored = await AsyncStorage.getItem('user_profile');
            if (stored) {
                const data = JSON.parse(stored);
                setNickname(data.nickname || '');
                setRealName(data.realName || '');
                setBio(data.bio || '');
                setImageUrl(data.imageUrl || '');

                // Parse Job (Format: "Category (Subfield)" or just "JobTitle")
                const fullJob = data.job || '';
                if (fullJob.includes('(') && fullJob.includes(')')) {
                    const [cat, sub] = fullJob.split(' (');
                    if (JOB_CATEGORIES[cat]) {
                        setSelectedCategory(cat);
                        setSelectedSubfield(sub.replace(')', ''));
                    } else {
                        setCustomJob(fullJob);
                    }
                } else {
                    setCustomJob(fullJob);
                }

                setBusinessNum(data.businessNum || '');
                setResearcherId(data.researcherId || '');
                setIsVerified(data.isVerified || false);
            }
        } catch (e) {
            console.error("Failed to load profile", e);
        }
    };

    // 4. Save Logic
    const handleSave = async (skipVerification = false) => {
        try {
            // Construct Job Title
            const finalJob = customJob || (selectedSubfield ? `${selectedCategory} (${selectedSubfield})` : selectedCategory);

            const profileData = {
                nickname, realName, bio, imageUrl,
                job: finalJob,
                businessNum, researcherId,
                isVerified: isVerified
            };
            await AsyncStorage.setItem('user_profile', JSON.stringify(profileData));
            onSave(); // Notify parent
            onClose();
        } catch (e) {
            console.error("Failed to save", e);
        }
    };

    // 5. Verification Simulation
    const handleVerify = () => {
        if (businessNum.length < 10 && researcherId.length < 8) {
            alert("Please enter a valid Business Number (10 digits) or Researcher ID.");
            return;
        }
        setIsVerified(true);
        alert("Verification Successful! Professional Agent Unlocked.");
    };

    const displayJob = customJob || (selectedSubfield ? `${selectedCategory} (${selectedSubfield})` : selectedCategory);

    return (
        <View className="flex-1 bg-[#050B14] flex-row">
            {/* LEFT COLUMN: Input Forms */}
            <View className="flex-1 p-8 border-r border-white/5">
                <View className="flex-row items-center justify-between mb-8">
                    <View>
                        <Text className="text-white text-3xl font-bold mb-2">Setup Your Profile</Text>
                        <Text className="text-slate-400">Customise your persona and unlock professional tools.</Text>
                    </View>
                    <View className="flex-row gap-3">
                        {!isVerified && (
                            <TouchableOpacity onPress={() => handleSave(true)} className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5">
                                <Text className="text-slate-400 font-semibold">Skip for now</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => handleSave(false)} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20">
                            <Text className="text-white font-bold">Save & Continue</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Section 1: Identity */}
                    <View className="mb-8">
                        <Text className="text-slate-500 text-xs font-bold uppercase mb-4 tracking-wider">Identity</Text>
                        <View className="bg-[#0F172A] p-6 rounded-3xl border border-white/5 gap-5">
                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Text className="text-slate-300 text-sm mb-2 font-medium">Real Name</Text>
                                    <TextInput
                                        className="bg-slate-900 border border-white/10 rounded-xl p-3 text-white"
                                        placeholder="Name"
                                        placeholderTextColor="#475569"
                                        value={realName}
                                        onChangeText={setRealName}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-300 text-sm mb-2 font-medium">Nickname</Text>
                                    <TextInput
                                        className="bg-slate-900 border border-white/10 rounded-xl p-3 text-white"
                                        placeholder="Nickname"
                                        placeholderTextColor="#475569"
                                        value={nickname}
                                        onChangeText={setNickname}
                                    />
                                </View>
                            </View>
                            <View>
                                <Text className="text-slate-300 text-sm mb-2 font-medium">Profile Image URL</Text>
                                <TextInput
                                    className="bg-slate-900 border border-white/10 rounded-xl p-3 text-white"
                                    placeholder="https://example.com/photo.jpg"
                                    placeholderTextColor="#475569"
                                    value={imageUrl}
                                    onChangeText={setImageUrl}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Section 2: Profession (Hierarchical Selector) */}
                    <View className="mb-8">
                        <Text className="text-slate-500 text-xs font-bold uppercase mb-4 tracking-wider">Profession & Expertise</Text>
                        <View className="bg-[#0F172A] p-6 rounded-3xl border border-white/5">
                            <Text className="text-slate-300 text-sm mb-3 font-medium">Select Industry</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-4">
                                {Object.keys(JOB_CATEGORIES).map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => { setSelectedCategory(cat); setSelectedSubfield(''); setCustomJob(''); }}
                                        className={`px-4 py-2 rounded-full border ${selectedCategory === cat ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-white/10'}`}
                                    >
                                        <Text className={`text-sm font-medium ${selectedCategory === cat ? 'text-white' : 'text-slate-400'}`}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text className="text-slate-300 text-sm mb-3 font-medium">Select Specialization</Text>
                            <View className="flex-row flex-wrap gap-2 mb-4">
                                {JOB_CATEGORIES[selectedCategory]?.map(sub => (
                                    <TouchableOpacity
                                        key={sub}
                                        onPress={() => { setSelectedSubfield(sub); setCustomJob(''); }}
                                        className={`px-4 py-2 rounded-full border ${selectedSubfield === sub ? 'bg-blue-500/20 border-blue-500' : 'bg-slate-900 border-dashed border-slate-700'}`}
                                    >
                                        <Text className={`text-sm ${selectedSubfield === sub ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>{sub}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View>
                                <Text className="text-slate-300 text-sm mb-2 font-medium">Bio / Introduction</Text>
                                <TextInput
                                    className="bg-slate-900 border border-white/10 rounded-xl p-3 text-white min-h-[80px]"
                                    placeholder="Tell us about your work..."
                                    placeholderTextColor="#475569"
                                    multiline
                                    textAlignVertical="top"
                                    value={bio}
                                    onChangeText={setBio}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Section 3: Premium Verification */}
                    <View className="mb-8">
                        <View className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-[1px] relative overflow-hidden">
                            {/* Gold/Blue Gradient Border */}
                            <View className="absolute inset-0 bg-blue-500 opacity-20" />

                            <View className="bg-[#0F172A] rounded-[23px] p-6">
                                <View className="flex-row items-center justify-between mb-4">
                                    <View className="flex-row items-center gap-2">
                                        <Crown size={20} color="#F59E0B" fill="#F59E0B" />
                                        <Text className="text-white font-bold text-lg">Professional Agent Access</Text>
                                    </View>
                                    {isVerified ? (
                                        <View className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 flex-row items-center gap-1.5">
                                            <ShieldCheck size={14} color="#34D399" />
                                            <Text className="text-emerald-400 text-xs font-bold">ACTIVE</Text>
                                        </View>
                                    ) : (
                                        <Text className="text-slate-500 text-xs">Optional</Text>
                                    )}
                                </View>

                                <Text className="text-slate-400 text-sm mb-6 leading-relaxed">
                                    Verify your credentials to unlock <Text className="text-blue-400 font-bold">Deep Research Agents</Text>,
                                    access <Text className="text-blue-400 font-bold">Industrial Data</Text>, and get
                                    <Text className="text-blue-400 font-bold"> Priority Processing</Text>.
                                </Text>

                                {!isVerified && (
                                    <View className="gap-4">
                                        <View className="flex-row gap-4">
                                            <TextInput
                                                className="flex-1 bg-[#050B14] border border-white/10 rounded-xl p-3 text-white"
                                                placeholder="Business Reg. No. (000-00-00000)"
                                                placeholderTextColor="#475569"
                                                keyboardType="numeric"
                                                value={businessNum}
                                                onChangeText={setBusinessNum}
                                            />
                                            <TouchableOpacity onPress={handleVerify} className="bg-blue-600 px-5 rounded-xl justify-center shadow-lg shadow-blue-600/20">
                                                <Text className="text-white font-bold text-sm">Verify</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <View className="flex-row gap-4">
                                            <TextInput
                                                className="flex-1 bg-[#050B14] border border-white/10 rounded-xl p-3 text-white"
                                                placeholder="Researcher ID (KRI-0000)"
                                                placeholderTextColor="#475569"
                                                value={researcherId}
                                                onChangeText={setResearcherId}
                                            />
                                            <TouchableOpacity onPress={handleVerify} className="bg-purple-600 px-5 rounded-xl justify-center shadow-lg shadow-purple-600/20">
                                                <Text className="text-white font-bold text-sm">Verify</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}

                                {isVerified && (
                                    <View className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 flex-row items-center gap-3">
                                        <Briefcase size={20} color="#60A5FA" />
                                        <View>
                                            <Text className="text-blue-400 font-bold text-sm">Professional Workspace Unlocked</Text>
                                            <Text className="text-blue-300/60 text-xs">Your agent will now prioritize high-fidelity sources.</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>

            {/* RIGHT COLUMN: Live Preview */}
            <View className="w-[400px] p-8 bg-[#020617] border-l border-white/5 flex items-center justify-center">
                <View className="mb-6 items-center">
                    <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">LIVE PREVIEW</Text>
                    <Text className="text-slate-400 text-center text-sm">Your card as it appears to others.</Text>
                </View>

                {/* The Preview Card */}
                <View className="w-[340px] h-[520px] shadow-2xl shadow-blue-900/20">
                    <ProfileCard
                        readOnly={true}
                        previewData={{
                            nickname: nickname || "Nickname",
                            realName: realName || "Real Name",
                            role: displayJob || "Job Title",
                            bio: bio || "Your bio will appear here.",
                            imageUrl: imageUrl
                        }}
                    />
                </View>

                {isVerified && (
                    <View className="mt-8 flex-row items-center bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-6 py-4 rounded-2xl border border-amber-500/20 w-full">
                        <Crown size={24} color="#F59E0B" className="mr-4" />
                        <View className="flex-1">
                            <Text className="text-amber-400 font-bold text-sm">PRO AGENT ENABLED</Text>
                            <Text className="text-amber-500/60 text-xs mt-0.5">Verified Professional</Text>
                        </View>
                        <ShieldCheck size={16} color="#F59E0B" />
                    </View>
                )}
            </View>
        </View>
    );
};
