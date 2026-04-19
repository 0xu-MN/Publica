import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    SafeAreaView,
    ActivityIndicator,
    Modal
} from 'react-native';
import { 
    X, 
    Check, 
    Briefcase, 
    Rocket, 
    Beaker, 
    User as UserIcon, 
    MapPin, 
    GraduationCap, 
    Info, 
    Sparkles, 
    Search,
    Building,
    Cpu,
    TrendingUp,
    Lightbulb,
    FileText,
    Zap
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { JOB_CATEGORIES } from '../utils/profileConstants';
import Stepper, { Step } from '../components/ui/Stepper';

type UserType = 'business' | 'pre_entrepreneur' | 'researcher' | 'other';

const LOCATION_DATA: Record<string, string[]> = {
    '서울특별시': ['강남구', '서초구', '송파구', '마포구', '성동구', '종로구', '중구', '용산구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '양천구', '강서구', '구로구', '금천구', '영등포구', '동작구', '관악구', '강동구'],
    '경기도': ['수원시', '성남시', '용인시', '안양시', '안산시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '시흥시', '안성시', '양주시', '오산시', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시', '가평군', '양평군', '여주시', '연천군'],
    '인천광역시': ['계양구', '미추홀구', '남동구', '동구', '부평구', '서구', '연수구', '중구', '강화군', '옹진군'],
    '부산광역시': ['강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'],
    '대구광역시': ['남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'],
    '광주광역시': ['광산구', '남구', '동구', '북구', '서구'],
    '대전광역시': ['대덕구', '동구', '서구', '유성구', '중구'],
    '울산광역시': ['남구', '동구', '북구', '울주군', '중구'],
    '세종특별자치시': ['세종시'],
    '강원도': ['강릉시', '동해시', '삼척시', '속초시', '원주시', '춘천시', '태백시', '고성군', '양구군', '양양군', '영월군', '인제군', '정선군', '철원군', '평창군', '홍천군', '화천군', '횡성군'],
    '충청북도': ['제천시', '청주시', '충주시', '괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '증평군', '진천군'],
    '충청남도': ['계룡시', '공주시', '논산시', '당진시', '보령시', '서산시', '아산시', '천안시', '금산군', '부여군', '서천군', '예산군', '청양군', '태안군', '홍성군'],
    '전라북도': ['군산시', '김제시', '남원시', '익산시', '전주시', '정읍시', '고창군', '무주군', '부안군', '순창군', '완주군', '임실군', '장수군', '진안군'],
    '전라남도': ['광양시', '나주시', '목포시', '순천시', '여수시', '강진군', '고흥군', '곡성군', '구례군', '담양군', '무안군', '보성군', '신안군', '영광군', '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'],
    '경상북도': ['경산시', '경주시', '구미시', '김천시', '문경시', '상주시', '안동시', '영주시', '영천시', '포항시', '고령군', '군위군', '봉화군', '성주군', '영덕군', '영양군', '예천군', '울릉군', '울진군', '의성군', '청도군', '청송군', '칠곡군'],
    '경상남도': ['거제시', '김해시', '밀양시', '사천시', '양산시', '진주시', '창원시', '통영시', '거창군', '고성군', '남해군', '산청군', '의령군', '창녕군', '하동군', '함안군', '함양군', '합천군'],
    '제주특별자치도': ['제주시', '서귀포시']
};

const RESEARCHER_TYPES = [
    '대학생',
    '대학원생',
    '박사후 연구원',
    '전문 연구원',
    '교수',
    '기타'
];

const MAJOR_CATEGORIES = Object.keys(JOB_CATEGORIES);
const INDUSTRY_CATEGORIES = Object.keys(JOB_CATEGORIES);

// 예비창업가 창업 분야 - 실제 정부 창업 지원사업 분류 기준
const STARTUP_INDUSTRY_CATEGORIES = [
    'ICT / 소프트웨어',
    'AI / 빅데이터',
    '바이오 / 의료',
    '핀테크 / 금융',
    '제조 / 하드웨어',
    '유통 / 이커머스',
    '교육 / 에듀테크',
    '푸드 / 농업',
    '환경 / 에너지',
    '문화 / 콘텐츠',
    '게임 / 엔터테인먼트',
    '패션 / 뷰티',
    '부동산 / 건설',
    '물류 / 모빌리티',
    '소셜 / 커뮤니티',
    '헬스케어 / 웰니스',
    '법률 / 행정 서비스',
    '소비재 / 생활용품',
    '기타',
];

// 프리랜서 관심 키워드 드롭박스 옵션
const FREELANCER_INTEREST_OPTIONS = [
    '마케팅 / 광고',
    '디자인 / UI·UX',
    '개발 / 프로그래밍',
    '영상 / 사진',
    '글쓰기 / 카피라이팅',
    '번역 / 통역',
    '컨설팅 / 기획',
    '강의 / 교육',
    '세무 / 회계',
    '법률 / 특허',
    '음악 / 공연',
    '공예 / 수공예',
    '기타',
];

const BUSINESS_TYPES = [
    '농업, 임업 및 어업',
    '광업',
    '제조업',
    '전기, 가스, 증기 및 공기 조절 공급업',
    '수도, 하수 및 폐기물 처리, 원료 재생업',
    '건설업',
    '도매 및 소매업',
    '운수 및 창고업',
    '숙박 및 음식점업',
    '정보통신업',
    '금융 및 보험업',
    '부동산업',
    '전문, 과학 및 기술 서비스업',
    '사업시설 관리, 사업 지원 및 임대 서비스업',
    '공공 행정, 국방 및 사회보장 행정',
    '교육 서비스업',
    '보건업 및 사회복지 서비스업',
    '예술, 스포츠 및 여가관련 서비스업',
    '협회 및 단체, 수리 및 기타 개인 서비스업',
    '가구 내 고용활동 및 달리 분류되지 않은 자가 소비 생산활동',
    '국제 및 외국기관'
];

interface ProfileSetupProps {
    isEditing?: boolean;
    onClose?: () => void;
}

export const ProfileSetupScreen = ({ isEditing = false, onClose }: ProfileSetupProps) => {
    const { user, profile, refreshProfile, setProfileState } = useAuth();
    const [, setStep] = useState(1);
    const [userType, setUserType] = useState<UserType | null>(null);

    // Form States
    const [sido, setSido] = useState('');
    const [sigungu, setSigungu] = useState('');
    const [industry, setIndustry] = useState('');
    const [businessYears, setBusinessYears] = useState('');
    const [birthYear, setBirthYear] = useState('');
    const [keywords, setKeywords] = useState('');
    const [affiliation, setAffiliation] = useState('');
    const [businessRegNo, setBusinessRegNo] = useState('');
    const [researcherId, setResearcherId] = useState('');
    const [researcherType, setResearcherType] = useState<string>('');
    const [studentId, setStudentId] = useState('');
    const [hasStartupIntent, setHasStartupIntent] = useState(false);
    const [majorCategory, setMajorCategory] = useState('');
    const [expertise, setExpertise] = useState('');
    
    // Step 3: AI 작성 기반 프로필
    const [companyName, setCompanyName] = useState('');
    const [itemOneLiner, setItemOneLiner] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [coreTechnology, setCoreTechnology] = useState('');
    const [currentAchievements, setCurrentAchievements] = useState('');
    const [teamBackground, setTeamBackground] = useState('');
    const [targetMarket, setTargetMarket] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [bizVerified, setBizVerified] = useState(false);
    const [bizStatus, setBizStatus] = useState<{ text: string; taxType: string } | null>(null);
    const [bizError, setBizError] = useState<string | null>(null);
    const [freelancerInterestCustom, setFreelancerInterestCustom] = useState('');
    const [pickerModal, setPickerModal] = useState<{ visible: boolean, type: 'sido' | 'sigungu' | 'researcherType' | 'majorCategory' | 'expertise' | 'industryCategory' | 'businessType' | 'freelancerInterest' }>({ visible: false, type: 'sido' });

    useEffect(() => {
        if (profile) {
            if (profile.user_type) setUserType(profile.user_type as UserType);
            if (profile.location) {
                const parts = profile.location.split(' ');
                if (parts.length >= 1) setSido(parts[0]);
                if (parts.length >= 2) setSigungu(parts.slice(1).join(' '));
            } else {
                if (profile.sido) setSido(profile.sido);
                if (profile.sigungu) setSigungu(profile.sigungu);
            }
            if (profile.industry) setIndustry(profile.industry);
            if (profile.business_years) setBusinessYears(profile.business_years);
            if (profile.birth_year) setBirthYear(profile.birth_year.toString());
            if (profile.research_keywords) setKeywords(profile.research_keywords.join(', '));
            if (profile.affiliation) setAffiliation(profile.affiliation);
            if (profile.business_reg_no) setBusinessRegNo(profile.business_reg_no);
            if (profile.researcher_id) setResearcherId(profile.researcher_id);
            if (profile.researcher_type) setResearcherType(profile.researcher_type);
            if (profile.student_id) setStudentId(profile.student_id);
            if (profile.has_startup_intent) setHasStartupIntent(profile.has_startup_intent);
            if (profile.major_category) setMajorCategory(profile.major_category);
            if (profile.expertise) setExpertise(profile.expertise);
            
            if (profile.company_name) setCompanyName(profile.company_name);
            if (profile.item_one_liner) setItemOneLiner(profile.item_one_liner);
            if (profile.item_description) setItemDescription(profile.item_description);
            if (profile.core_technology) setCoreTechnology(profile.core_technology);
            if (profile.current_achievements) setCurrentAchievements(profile.current_achievements);
            if (profile.team_background) setTeamBackground(profile.team_background);
            if (profile.target_market) setTargetMarket(profile.target_market);

            if (isEditing) setStep(2);
        }
    }, [profile, isEditing]);

    const performAutoFill = async (payload: any) => {
        try {
            setIsAutoFilling(true);
            const { data, error } = await supabase.functions.invoke('validate-business', {
                body: payload
            });

            if (error) throw new Error(error.message);
            if (data?.success && data?.data) {
                if (data.data.businessNumber) setBusinessRegNo(data.data.businessNumber);
                if (data.data.sido) setSido(data.data.sido);
                if (data.data.sigungu) setSigungu(data.data.sigungu);
                if (data.data.industry) setIndustry(data.data.industry);
                if (data.data.companyName) setCompanyName(data.data.companyName);
                if (data.data.companyName && !itemOneLiner) {
                    setItemOneLiner(`${data.data.companyName}의 ${data.data.industry || ''} 서비스/제품`);
                }
                setBizVerified(true);
                setBizError(null);
                setBizStatus({
                    text: data.data.status || '계속사업자',
                    taxType: data.data.taxType || '',
                });
            } else if (data && !data.success) {
                setBizVerified(false);
                setBizStatus(null);
                setBizError(data.error || '사업자 정보를 확인할 수 없습니다.');
            }
        } catch (e: any) {
            console.error("AutoFill Error:", e);
            Alert.alert('알림', '정보를 자동으로 불러오는 데 실패했습니다. 직접 입력해주세요.');
        } finally {
            setIsAutoFilling(false);
        }
    };

    const fetchBusinessInfoByNumber = () => {
        const raw = businessRegNo.replace(/[-\s]/g, '');
        if (!raw || raw.length !== 10) {
            Alert.alert('알림', '사업자등록번호 10자리를 입력해주세요.\n예: 1234567890 또는 123-45-67890');
            return;
        }
        setBizVerified(false);
        performAutoFill({ businessNumber: raw });
    };

    const isFormValid = () => {
        if (!userType) return false;
        if (userType === 'business') {
            return sido !== '' && sigungu !== '' && industry !== '' && businessYears !== '';
        }
        if (userType === 'pre_entrepreneur') {
            return sido !== '' && sigungu !== '' && industry !== '';
        }
        if (userType === 'researcher') {
            const isStudent = researcherType === '대학생' || researcherType === '대학원생';
            if (isStudent) {
                return keywords !== '' && affiliation !== '' && studentId !== '' && majorCategory !== '' && expertise !== '';
            }
            return researcherType !== '' && keywords !== '' && affiliation !== '' && majorCategory !== '' && expertise !== '';
        }
        if (userType === 'other') {
            const interestValid = keywords !== '' && (keywords !== '기타' || freelancerInterestCustom.trim() !== '');
            return sido !== '' && sigungu !== '' && interestValid;
        }
        return false;
    };

    const handleSave = async () => {
        if (!user || !userType) return;
        if (!isFormValid()) {
            Alert.alert('알림', '필수 항목을 모두 입력해주세요.');
            return;
        }

        setIsSaving(true);
        const fullLocation = sido && sigungu ? `${sido} ${sigungu}` : sido;
        // 프리랜서 기타 선택 시 직접 입력값 사용
        const resolvedKeywords = (userType === 'other' && keywords === '기타')
            ? freelancerInterestCustom.trim()
            : keywords;

        try {
            const updates: any = {
                id: user.id,
                user_type: userType,
                updated_at: new Date().toISOString(),
                location: fullLocation,
                industry: (userType === 'business' || userType === 'pre_entrepreneur') ? industry : null,
                research_keywords: resolvedKeywords.split(',').map((k: string) => k.trim()).filter((k: string) => k !== ''),
            };

            if (userType === 'business') {
                updates.business_years = businessYears;
                updates.business_reg_no = businessRegNo || null;
            }
            if (userType === 'pre_entrepreneur') {
                updates.birth_year = birthYear ? parseInt(birthYear) : null;
            }
            if (userType === 'other') {
                updates.affiliation = affiliation;
            }
            if (userType === 'business' || userType === 'pre_entrepreneur') {
                updates.company_name = companyName || null;
                updates.item_one_liner = itemOneLiner || null;
                updates.item_description = itemDescription || null;
                updates.core_technology = coreTechnology || null;
                updates.current_achievements = currentAchievements || null;
                updates.team_background = teamBackground || null;
                updates.target_market = targetMarket || null;
            }

            const finalJob = majorCategory || industry;
            const profileData = {
                nickname: user.email?.split('@')[0],
                realName: profile?.full_name || '',
                bio: '',
                imageUrl: profile?.avatar_url || '',
                interests: resolvedKeywords.split(',').map((k: string) => k.trim()).filter((k: string) => k !== ''),
                job: finalJob,
                careers: [],
                qualifications: []
            };
            await AsyncStorage.setItem('user_profile', JSON.stringify(profileData));

            let { error: upsertError } = await supabase.from('profiles').upsert(updates);
            if (upsertError) throw upsertError;

            setProfileState(updates);
            if (onClose) onClose();

            Alert.alert(
                isEditing ? '수정 완료' : '환영합니다!',
                isEditing ? '프로필이 업데이트되었습니다.' : '프로필 설정이 완료되었습니다.'
            );
        } catch (e: any) {
            console.error('Save Profile Error:', e);
            Alert.alert('오류', `프로필 저장 중 문제가 발생했습니다: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const renderTypeCard = (type: UserType, title: string, desc: string, icon: any) => (
        <TouchableOpacity
            style={[styles.typeCard, userType === type && styles.typeCardActive]}
            onPress={() => setUserType(type)}
        >
            <View style={[styles.iconBox, userType === type && styles.iconBoxActive]}>
                {icon}
            </View>
            <View style={styles.typeInfo}>
                <Text style={styles.typeTitle}>{title}</Text>
                <Text style={styles.typeDesc}>{desc}</Text>
            </View>
            {userType === type && <Check size={20} color="#7C3AED" />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.overlay}>
                <View style={styles.modalCard}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {isEditing && (
                            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                                <X color="#94A3B8" size={24} />
                            </TouchableOpacity>
                        )}
                        <View style={styles.header}>
                            <Text style={styles.welcomeText}>{isEditing ? '프로필 수정' : '프로필 완성하기'}</Text>
                            <Text style={styles.subText}>{isEditing ? '변경할 정보를 확인해주세요.' : 'AI 맞춤 매칭을 위해 필수 정보를 확인해주세요.'}</Text>
                        </View>

                        <Stepper
                            key={`stepper-${isEditing ? 'edit' : 'new'}-${userType || 'none'}`}
                            initialStep={isEditing ? 2 : 1}
                            onStepChange={setStep}
                            onFinalStepCompleted={handleSave}
                            nextButtonText="다음으로"
                            backButtonText="이전으로"
                            disableStepIndicators={false}
                        >
                            <Step>
                                <View style={styles.stepContainer}>
                                    <View style={styles.cardGrid}>
                                        {renderTypeCard('business', '기존 사업자', '사업자 등록증 보유', <Briefcase size={22} color={userType === 'business' ? '#7C3AED' : '#64748B'} />)}
                                        {renderTypeCard('pre_entrepreneur', '예비 창업자', '창업 준비/아이디어', <Rocket size={22} color={userType === 'pre_entrepreneur' ? '#7C3AED' : '#64748B'} />)}
                                        {renderTypeCard('researcher', '연구원 / 학생', 'R&D 및 학술 연구', <Beaker size={22} color={userType === 'researcher' ? '#7C3AED' : '#64748B'} />)}
                                        {renderTypeCard('other', '프리랜서 / 기타', 'N잡러, 창작자 등', <UserIcon size={22} color={userType === 'other' ? '#7C3AED' : '#64748B'} />)}
                                    </View>
                                </View>
                            </Step>

                            <Step>
                                <View style={styles.stepContainer}>
                                    {(userType === 'business' || userType === 'pre_entrepreneur' || userType === 'other') && (
                                        <View style={styles.premiumCard}>
                                            <View style={styles.cardHeader}>
                                                <MapPin size={18} color="#7C3AED" />
                                                <Text style={styles.cardHeaderTitle}>활동 거점 및 산업</Text>
                                            </View>
                                            {userType === 'business' && (
                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.label}>사업자 번호 인증</Text>
                                                    <Text style={styles.inputHint}>하이픈(-) 없이 숫자 10자리만 입력하세요</Text>
                                                    <View style={[
                                                        styles.inputWrapper,
                                                        bizVerified && { borderColor: '#16A34A', borderWidth: 1.5 },
                                                        bizError && { borderColor: '#DC2626', borderWidth: 1.5 },
                                                    ]}>
                                                        <Search size={18} color={bizVerified ? '#16A34A' : bizError ? '#DC2626' : '#94A3B8'} style={styles.inputIcon} />
                                                        <TextInput
                                                            style={styles.inputWithIcon}
                                                            placeholder="예: 1234567890"
                                                            placeholderTextColor="#94A3B8"
                                                            value={businessRegNo}
                                                            onChangeText={(t) => {
                                                                setBusinessRegNo(t);
                                                                setBizVerified(false);
                                                                setBizStatus(null);
                                                                setBizError(null);
                                                            }}
                                                            keyboardType="numeric"
                                                            maxLength={12}
                                                        />
                                                    </View>
                                                    <TouchableOpacity
                                                        onPress={fetchBusinessInfoByNumber}
                                                        disabled={isAutoFilling}
                                                        style={[
                                                            styles.verifyBtn,
                                                            bizVerified && styles.verifyBtnDone,
                                                            bizError ? styles.verifyBtnError : null,
                                                        ]}
                                                    >
                                                        {isAutoFilling
                                                            ? <><ActivityIndicator size="small" color="#fff" /><Text style={styles.verifyBtnText}>조회 중...</Text></>
                                                            : bizVerified
                                                                ? <><Check size={15} color="#fff" /><Text style={styles.verifyBtnText}>인증 완료</Text></>
                                                                : <Text style={styles.verifyBtnText}>인증하기</Text>
                                                        }
                                                    </TouchableOpacity>
                                                    {bizVerified && bizStatus && (
                                                        <View style={styles.bizResultBox}>
                                                            <Check size={15} color="#16A34A" />
                                                            <View>
                                                                <Text style={styles.bizResultOk}>사업자 인증 성공</Text>
                                                                <Text style={styles.bizResultSub}>상태: {bizStatus.text}{bizStatus.taxType ? ` · ${bizStatus.taxType}` : ''}</Text>
                                                                <Text style={styles.bizResultSub}>지역 및 업종은 아래에서 직접 선택해주세요</Text>
                                                            </View>
                                                        </View>
                                                    )}
                                                    {bizError && (
                                                        <View style={styles.bizErrorBox}>
                                                            <Text style={styles.bizErrorText}>✗ {bizError}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            )}
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.label}>활동 지역 <Text style={styles.required}>*</Text></Text>
                                                <View style={styles.row}>
                                                    <TouchableOpacity
                                                        style={[styles.dropdown, { flex: 1 }]}
                                                        onPress={() => setPickerModal({ visible: true, type: 'sido' })}
                                                    >
                                                        <Text style={[styles.dropdownText, !sido && styles.placeholderText]}>{sido || '시/도'}</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.dropdown, { flex: 1 }]}
                                                        onPress={() => {
                                                            if (!sido) {
                                                                Alert.alert('알림', '시/도를 먼저 선택해주세요.');
                                                                return;
                                                            }
                                                            setPickerModal({ visible: true, type: 'sigungu' })
                                                        }}
                                                    >
                                                        <Text style={[styles.dropdownText, !sigungu && styles.placeholderText]}>{sigungu || '구/군'}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>

                                            {userType === 'business' && (
                                                <>
                                                    <View style={styles.inputGroup}>
                                                        <Text style={styles.label}>사업 업력 <Text style={styles.required}>*</Text></Text>
                                                        <View style={styles.row}>
                                                            {['<3yr', '3-7yr', '>7yr'].map(y => (
                                                                <TouchableOpacity
                                                                    key={y}
                                                                    style={[styles.chip, businessYears === y && styles.chipActive]}
                                                                    onPress={() => setBusinessYears(y)}
                                                                >
                                                                    <Text style={[styles.chipText, businessYears === y && styles.chipTextActive]}>{y}</Text>
                                                                </TouchableOpacity>
                                                            ))}
                                                        </View>
                                                    </View>
                                                    <View style={styles.inputGroup}>
                                                        <Text style={styles.label}>사업의 종류 <Text style={styles.required}>*</Text></Text>
                                                        <TouchableOpacity
                                                            style={styles.dropdown}
                                                            onPress={() => setPickerModal({ visible: true, type: 'businessType' })}
                                                        >
                                                            <Text style={[styles.dropdownText, !industry && styles.placeholderText]}>
                                                                {industry || '업종 선택 (예: 정보통신업)'}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </>
                                            )}

                                            {userType === 'pre_entrepreneur' && (
                                                <>
                                                    <View style={styles.inputGroup}>
                                                        <Text style={styles.label}>출생 연도</Text>
                                                        <TextInput style={styles.input} placeholder="예: 1995" placeholderTextColor="#94A3B8" keyboardType="numeric" value={birthYear} onChangeText={setBirthYear} />
                                                    </View>
                                                    <View style={styles.inputGroup}>
                                                        <Text style={styles.label}>창업 분야 <Text style={styles.required}>*</Text></Text>
                                                        <TouchableOpacity
                                                            style={styles.dropdown}
                                                            onPress={() => setPickerModal({ visible: true, type: 'industryCategory' })}
                                                        >
                                                            <Text style={[styles.dropdownText, !industry && styles.placeholderText]}>
                                                                {industry || '분야 선택'}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </>
                                            )}
                                        </View>
                                    )}

                                    {userType === 'researcher' && (
                                        <View style={styles.premiumCard}>
                                            <View style={styles.cardHeader}>
                                                <GraduationCap size={18} color="#7C3AED" />
                                                <Text style={styles.cardHeaderTitle}>소속 및 연구 정보</Text>
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.label}>연구원 구분 <Text style={styles.required}>*</Text></Text>
                                                <TouchableOpacity
                                                    style={styles.dropdown}
                                                    onPress={() => setPickerModal({ visible: true, type: 'researcherType' })}
                                                >
                                                    <Text style={[styles.dropdownText, !researcherType && styles.placeholderText]}>
                                                        {researcherType || '구분 선택'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.label}>
                                                    {(researcherType === '대학생' || researcherType === '대학원생') ? '학교명' : '소속 기관'} <Text style={styles.required}>*</Text>
                                                </Text>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder={(researcherType === '대학생' || researcherType === '대학원생') ? "대학교 이름을 입력해주세요" : "소속 기관을 입력해주세요"}
                                                    placeholderTextColor="#94A3B8"
                                                    value={affiliation}
                                                    onChangeText={setAffiliation}
                                                />
                                            </View>

                                            <View style={styles.inputGroup}>
                                                <Text style={styles.label}>전공 / 연구 분야 <Text style={styles.required}>*</Text></Text>
                                                <TouchableOpacity
                                                    style={styles.dropdown}
                                                    onPress={() => setPickerModal({ visible: true, type: 'majorCategory' })}
                                                >
                                                    <Text style={[styles.dropdownText, !majorCategory && styles.placeholderText]}>
                                                        {majorCategory || '분야 선택 (예: 과학기술)'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>

                                            {majorCategory !== '' && (
                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.label}>상세 연구 분야 <Text style={styles.required}>*</Text></Text>
                                                    <TouchableOpacity
                                                        style={styles.dropdown}
                                                        onPress={() => setPickerModal({ visible: true, type: 'expertise' })}
                                                    >
                                                        <Text style={[styles.dropdownText, !expertise && styles.placeholderText]}>
                                                            {expertise || '세부 분야 선택 (예: 바이오/의료)'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}

                                            {(researcherType === '대학생' || researcherType === '대학원생') && (
                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.label}>학번 <Text style={styles.required}>*</Text></Text>
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="학번을 입력해주세요"
                                                        placeholderTextColor="#94A3B8"
                                                        value={studentId}
                                                        onChangeText={setStudentId}
                                                    />
                                                </View>
                                            )}

                                            <View style={styles.inputGroup}>
                                                <Text style={styles.label}>연구자 번호 (NTIS 등)</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="보유 시 입력 (신뢰도 향상)"
                                                    placeholderTextColor="#94A3B8"
                                                    value={researcherId}
                                                    onChangeText={setResearcherId}
                                                />
                                            </View>

                                            <TouchableOpacity
                                                style={styles.checkboxContainer}
                                                onPress={() => setHasStartupIntent(!hasStartupIntent)}
                                            >
                                                <View style={[styles.checkbox, hasStartupIntent && styles.checkboxChecked]}>
                                                    {hasStartupIntent && <Check size={14} color="white" />}
                                                </View>
                                                <Text style={styles.checkboxLabel}>🚀 창업에 관심이 있습니다 (관련 공고 매칭)</Text>
                                            </TouchableOpacity>

                                            <View style={styles.inputGroup}>
                                                <Text style={styles.label}>전문 분야 키워드 *</Text>
                                                <TextInput style={styles.input} placeholder="쉼표로 구분 예: 인공지능, 빅데이터" placeholderTextColor="#475569" value={keywords} onChangeText={setKeywords} />
                                            </View>
                                        </View>
                                    )}

                                    {userType === 'other' && (
                                        <View style={styles.premiumCard}>
                                            <View style={styles.cardHeader}>
                                                <Info size={18} color="#7C3AED" />
                                                <Text style={styles.cardHeaderTitle}>상세 정보</Text>
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.label}>현재 소속 / 직함</Text>
                                                <TextInput style={styles.input} placeholder="예: 프리랜서 디자이너" placeholderTextColor="#94A3B8" value={affiliation} onChangeText={setAffiliation} />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.label}>관심 분야 <Text style={styles.required}>*</Text></Text>
                                                <TouchableOpacity
                                                    style={styles.dropdown}
                                                    onPress={() => setPickerModal({ visible: true, type: 'freelancerInterest' })}
                                                >
                                                    <Text style={[styles.dropdownText, !keywords && styles.placeholderText]}>
                                                        {keywords === '기타' ? '기타 (직접 입력)' : keywords || '관심 분야 선택'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                            {keywords === '기타' && (
                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.label}>직접 입력 <Text style={styles.required}>*</Text></Text>
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="관심 분야를 직접 입력하세요"
                                                        placeholderTextColor="#94A3B8"
                                                        value={freelancerInterestCustom}
                                                        onChangeText={setFreelancerInterestCustom}
                                                    />
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            </Step>

                            {(userType === 'business' || userType === 'pre_entrepreneur') && (
                                <Step>
                                    <View style={styles.stepContainer}>
                                        <View style={styles.aiPremiumBanner}>
                                            <View style={styles.bannerIconBox}>
                                                <Lightbulb size={24} color="#FFFFFF" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.aiPremiumBannerTitle}>AI 사업계획서 자동 작성 프로필</Text>
                                                <Text style={styles.aiPremiumBannerDesc}>
                                                    아래 정보는 AI가 귀사에 최적화된 사업계획서 초안을 작성할 때 {'\n'}
                                                    <Text style={{ fontWeight: '800', color: '#7C3AED' }}>가장 핵심적인 근거</Text>가 됩니다. (선택 입력)
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.premiumCard}>
                                            <View style={styles.cardHeader}>
                                                <Building size={18} color="#7C3AED" />
                                                <Text style={styles.cardHeaderTitle}>아이템 기본 정보</Text>
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.label}>회사명 / 아이템명</Text>
                                                <TextInput style={styles.input} placeholder="예: (주)퍼블리카, InsightFlow" value={companyName} onChangeText={setCompanyName} />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <View style={styles.labelRow}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                        <Sparkles size={14} color="#F59E0B" />
                                                        <Text style={styles.label}>아이템 한 줄 정의</Text>
                                                    </View>
                                                    <Text style={styles.labelHint}>⭐ 가장 중요</Text>
                                                </View>
                                                <TextInput style={styles.input} placeholder="예: 마케터를 위한 SaaS 통합 관리 플랫폼" value={itemOneLiner} onChangeText={setItemOneLiner} />
                                            </View>
                                        </View>

                                        <View style={styles.premiumCard}>
                                            <View style={styles.cardHeader}>
                                                <Cpu size={18} color="#7C3AED" />
                                                <Text style={styles.cardHeaderTitle}>상세 설명 및 핵심 기술</Text>
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.label}>아이템 상세 설명</Text>
                                                <TextInput style={[styles.input, styles.textArea]} placeholder="문제를 어떻게 해결하는지 설명해주세요." value={itemDescription} onChangeText={setItemDescription} multiline numberOfLines={3} />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.label}>핵심 기술 / 차별점</Text>
                                                <TextInput style={[styles.input, styles.textArea]} placeholder="보유 기술 및 강점을 입력하세요." value={coreTechnology} onChangeText={setCoreTechnology} multiline numberOfLines={3} />
                                            </View>
                                        </View>

                                        <View style={styles.premiumCard}>
                                            <View style={styles.cardHeader}>
                                                <TrendingUp size={18} color="#7C3AED" />
                                                <Text style={styles.cardHeaderTitle}>팀 역량 및 현재 성과</Text>
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.label}>팀 핵심 역량</Text>
                                                <TextInput style={[styles.input, styles.textArea]} placeholder="대표자 및 멤버들의 배경을 입력하세요." value={teamBackground} onChangeText={setTeamBackground} multiline numberOfLines={2} />
                                            </View>
                                        </View>
                                    </View>
                                </Step>
                            )}
                        </Stepper>
                    </ScrollView>
                </View>
            </View>

            {/* Custom Picker Modal */}
            <Modal visible={pickerModal.visible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {pickerModal.type === 'sido' ? '시/도 선택' :
                                    pickerModal.type === 'sigungu' ? '구/군 선택' :
                                        pickerModal.type === 'researcherType' ? '구분 선택' :
                                            pickerModal.type === 'majorCategory' ? '전공 분야 선택' :
                                                pickerModal.type === 'expertise' ? '상세 분야 선택' :
                                                    pickerModal.type === 'businessType' ? '사업의 종류 선택' : '산업 분야 선택'}
                            </Text>
                            <TouchableOpacity onPress={() => setPickerModal({ ...pickerModal, visible: false })}>
                                <Text style={{ color: '#7C3AED', fontWeight: 'bold' }}>닫기</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            {(pickerModal.type === 'sido' ? Object.keys(LOCATION_DATA) :
                                pickerModal.type === 'sigungu' ? (LOCATION_DATA[sido] || []) :
                                    pickerModal.type === 'researcherType' ? RESEARCHER_TYPES :
                                        pickerModal.type === 'majorCategory' ? MAJOR_CATEGORIES :
                                            pickerModal.type === 'expertise' ? (JOB_CATEGORIES[majorCategory] || []) :
                                                pickerModal.type === 'businessType' ? BUSINESS_TYPES :
                                                pickerModal.type === 'industryCategory' ? STARTUP_INDUSTRY_CATEGORIES :
                                                pickerModal.type === 'freelancerInterest' ? FREELANCER_INTEREST_OPTIONS :
                                                    INDUSTRY_CATEGORIES).map(item => (
                                                        <TouchableOpacity
                                                            key={item}
                                                            style={styles.modalItem}
                                                            onPress={() => {
                                                                if (pickerModal.type === 'sido') {
                                                                    setSido(item);
                                                                    setSigungu('');
                                                                } else if (pickerModal.type === 'sigungu') {
                                                                    setSigungu(item);
                                                                } else if (pickerModal.type === 'researcherType') {
                                                                    setResearcherType(item);
                                                                } else if (pickerModal.type === 'majorCategory') {
                                                                    setMajorCategory(item);
                                                                    setExpertise('');
                                                                } else if (pickerModal.type === 'expertise') {
                                                                    setExpertise(item);
                                                                } else if (pickerModal.type === 'industryCategory' || pickerModal.type === 'businessType') {
                                                                    setIndustry(item);
                                                                } else if (pickerModal.type === 'freelancerInterest') {
                                                                    setKeywords(item);
                                                                    if (item !== '기타') setFreelancerInterestCustom('');
                                                                }
                                                                setPickerModal({ ...pickerModal, visible: false });
                                                            }}
                                                        >
                                                            <Text style={styles.modalItemText}>{item}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDF8F3' },
    overlay: { flex: 1, backgroundColor: 'rgba(253, 248, 243, 0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { 
        backgroundColor: 'white', 
        width: '100%', 
        maxWidth: 450, 
        maxHeight: '90%', 
        borderRadius: 32, 
        padding: 32, 
        shadowColor: '#000', 
        shadowOpacity: 0.1, 
        shadowRadius: 30, 
        elevation: 15, 
        position: 'relative',
        overflow: 'hidden' 
    },
    closeBtn: { position: 'absolute', top: 20, right: 20, zIndex: 10 },
    scrollContent: { paddingBottom: 60 },
    header: { marginBottom: 24, alignItems: 'center' },
    welcomeText: { color: '#0F172A', fontSize: 24, fontWeight: '800', marginBottom: 8 },
    subText: { color: '#64748B', fontSize: 14, textAlign: 'center', lineHeight: 20 },
    stepContainer: { flex: 1 },
    stepTitle: { color: '#0F172A', fontSize: 18, fontWeight: '700', marginBottom: 16 },
    cardGrid: { gap: 12, marginBottom: 24 },
    typeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    typeCardActive: { borderColor: '#7C3AED', backgroundColor: 'rgba(124, 58, 237, 0.05)' },
    iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    iconBoxActive: { backgroundColor: 'white' },
    typeInfo: { flex: 1 },
    typeTitle: { color: '#0F172A', fontSize: 15, fontWeight: '700', marginBottom: 2 },
    typeDesc: { color: '#64748B', fontSize: 12 },
    nextBtn: { backgroundColor: '#7C3AED', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    nextBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
    btnDisabled: { opacity: 0.4 },
    backBtn: { marginBottom: 16 },
    backBtnText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
    inputGroup: { marginBottom: 20 },
    label: { color: '#475569', fontSize: 13, fontWeight: '600', marginBottom: 8 },
    required: { color: '#EF4444' },
    input: {
        backgroundColor: '#F8FAFC',
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 16,
        color: '#0F172A',
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    row: { flexDirection: 'row', gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F1F5F9' },
    chipActive: { backgroundColor: '#7C3AED' },
    chipText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: 'white' },
    saveBtn: { backgroundColor: '#27272a', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
    dropdown: { backgroundColor: '#F8FAFC', height: 52, borderRadius: 14, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    dropdownText: { color: '#0F172A', fontSize: 15 },
    placeholderText: { color: '#94A3B8' },
    inputWrapper: { position: 'relative', justifyContent: 'center' },
    inputIcon: { position: 'absolute', left: 16, zIndex: 1 },
    inputWithIcon: {
        backgroundColor: '#F8FAFC',
        height: 52,
        borderRadius: 14,
        paddingLeft: 44,
        paddingRight: 16,
        color: '#0F172A',
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    uploadBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 12,
        marginTop: 12
    },
    uploadIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    uploadText: { color: '#334155', fontSize: 13, fontWeight: '600', flex: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, maxHeight: '70%' },
    modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalTitle: { color: '#0F172A', fontSize: 17, fontWeight: '700' },
    modalBody: { padding: 8 },
    modalItem: { padding: 18, borderRadius: 12 },
    modalItemText: { color: '#0F172A', fontSize: 16, textAlign: 'center' },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    checkboxChecked: {
        backgroundColor: '#7C3AED',
        borderColor: '#7C3AED'
    },
    checkboxLabel: {
        color: '#27272a',
        fontSize: 14,
        fontWeight: '600'
    },
    premiumCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    cardHeaderTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },
    aiPremiumBanner: {
        flexDirection: 'row',
        backgroundColor: 'rgba(124, 58, 237, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.1)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        alignItems: 'center',
        gap: 16,
    },
    bannerIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#7C3AED',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    aiPremiumBannerTitle: {
        color: '#1E1B4B',
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 4,
    },
    aiPremiumBannerDesc: {
        color: '#475569',
        fontSize: 13,
        lineHeight: 20,
    },
    premiumSaveBtn: {
        backgroundColor: '#0F172A',
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    saveBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
    autoFilledBadge: {
        color: '#7C3AED',
        fontSize: 12,
        fontWeight: '700',
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    labelHint: {
        color: '#F59E0B',
        fontSize: 11,
        fontWeight: '800',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
        paddingTop: 14,
    },
    verifyBtn: {
        marginTop: 8,
        backgroundColor: '#7C3AED',
        borderRadius: 10,
        paddingVertical: 11,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    verifyBtnDone: {
        backgroundColor: '#16A34A',
    },
    verifyBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    verifiedHint: {
        marginTop: 6,
        fontSize: 12,
        color: '#16A34A',
        fontWeight: '600',
    },
    inputHint: {
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 6,
        marginTop: 2,
    },
    verifyBtnError: {
        backgroundColor: '#DC2626',
    },
    bizResultBox: {
        marginTop: 10,
        backgroundColor: '#F0FDF4',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#86EFAC',
        padding: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    bizResultOk: {
        fontSize: 13,
        fontWeight: '700',
        color: '#16A34A',
        marginBottom: 2,
    },
    bizResultSub: {
        fontSize: 12,
        color: '#4B7A5A',
        marginTop: 1,
    },
    bizErrorBox: {
        marginTop: 10,
        backgroundColor: '#FEF2F2',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FECACA',
        padding: 12,
    },
    bizErrorText: {
        fontSize: 13,
        color: '#DC2626',
        fontWeight: '600',
    },
});
