import { supabase } from '../lib/supabase';

/**
 * Grant Template Service
 * Fetches or triggers parsing of grant application form templates.
 * Templates contain the section structure needed for the editor.
 */

export interface TemplateSection {
    title: string;
    description: string;
    required: boolean;
    max_length: number | null;
    order: number;
    hints: string | null;
}

export interface GrantTemplate {
    id: string;
    grant_id: string;
    sections: TemplateSection[];
    source_markdown: string | null;
    parsed_at: string;
}

/**
 * Fetch template for a grant. If not cached, trigger parsing.
 */
export const fetchTemplate = async (grantId: string): Promise<GrantTemplate | null> => {
    // 1. Check if template already exists
    const { data: existing, error } = await supabase
        .from('grant_templates')
        .select('*')
        .eq('grant_id', grantId)
        .order('parsed_at', { ascending: false })
        .limit(1)
        .single();

    if (existing && !error) {
        console.log(`📋 Template cache hit for grant ${grantId}: ${existing.sections?.length} sections`);
        return existing as GrantTemplate;
    }

    // 2. No cache — trigger parsing via Edge Function
    console.log(`🔄 Parsing template for grant ${grantId}...`);
    try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('parse-grant-template', {
            body: { grant_id: grantId },
        });

        if (fnError) {
            console.error('Template parsing failed:', fnError);
            return null;
        }

        if (fnData?.success && fnData?.sections) {
            // Re-fetch from DB (the Edge Function saved it)
            const { data: saved } = await supabase
                .from('grant_templates')
                .select('*')
                .eq('grant_id', grantId)
                .order('parsed_at', { ascending: false })
                .limit(1)
                .single();

            return saved as GrantTemplate || {
                id: '',
                grant_id: grantId,
                sections: fnData.sections,
                source_markdown: null,
                parsed_at: new Date().toISOString(),
            };
        }

        return null;
    } catch (err) {
        console.error('Template fetch error:', err);
        return null;
    }
};

/**
 * Convert template sections to HTML for the editor
 */
export const templateToEditorHtml = (template: GrantTemplate, grantTitle?: string): string => {
    const sections = template.sections || [];
    if (sections.length === 0) {
        return '<h1>새 문서</h1><p>템플릿을 불러올 수 없습니다. 직접 작성을 시작하세요.</p>';
    }

    let html = `<h1>${grantTitle || '지원서'}</h1>`;
    html += `<p style="color:#64748B"><em>아래 양식에 맞춰 각 섹션을 작성하세요. AI 작성 버튼으로 초안을 생성할 수 있습니다.</em></p><hr/>`;

    for (const section of sections.sort((a, b) => a.order - b.order)) {
        html += `<h2>${section.order}. ${section.title}${section.required ? ' *' : ''}</h2>`;
        if (section.description) {
            html += `<p style="color:#94A3B8"><em>${section.description}</em></p>`;
        }
        if (section.hints) {
            html += `<p style="color:#64748B; font-size:12px">💡 ${section.hints}</p>`;
        }
        if (section.max_length) {
            html += `<p style="color:#475569; font-size:11px">최대 ${section.max_length.toLocaleString()}자</p>`;
        }
        html += `<p><br/></p>`;  // Empty space for writing
    }

    return html;
};

/**
 * Get a default PSST template (fallback when no grant-specific template exists)
 */
export const getDefaultPSSTTemplate = (): TemplateSection[] => [
    {
        title: '사업 개요',
        description: '사업의 전반적인 개요, 배경, 목표를 기술하세요',
        required: true,
        max_length: 2000,
        order: 1,
        hints: '지원 사업의 목적에 부합하는 내용을 중심으로 작성',
    },
    {
        title: '문제인식 (Problem)',
        description: '현 시장의 문제점 및 고객의 Pain Point, 해결의 필요성',
        required: true,
        max_length: 3000,
        order: 2,
        hints: '구체적인 데이터와 사례를 포함하세요',
    },
    {
        title: '해결방안 (Solution)',
        description: '제공하는 서비스/제품의 구체적 설명, 경쟁사 대비 차별성',
        required: true,
        max_length: 3000,
        order: 3,
        hints: '기술적 우위성과 시장 경쟁력을 강조하세요',
    },
    {
        title: '성장전략 (Scale-up)',
        description: '국내외 시장 진출 전략, 수익 창출 모델(BM) 및 예상 매출',
        required: true,
        max_length: 3000,
        order: 4,
        hints: 'TAM/SAM/SOM 분석과 마일스톤을 포함하세요',
    },
    {
        title: '팀 구성 (Team)',
        description: '대표자 및 팀원의 전문성, 사업 추진 역량',
        required: true,
        max_length: 2000,
        order: 5,
        hints: '핵심 인력의 관련 경력과 역할을 상세히 기술',
    },
    {
        title: '자금 소요 계획',
        description: '정부지원금 활용 계획 및 마일스톤별 예산 배분',
        required: true,
        max_length: 2000,
        order: 6,
        hints: '세부 항목별 금액과 산출 근거를 포함',
    },
];
