/**
 * Fetch K-Startup business announcements
 */
export const fetchKStartupPrograms = async (): Promise<GovernmentProgram[]> => {
    try {
        const config = API_CONFIGS.K_STARTUP;
        const api = createAPIInstance(config.baseUrl);

        const response = await api.get<GovAPIResponse>(config.endpoints.announcements, {
            params: {
                serviceKey: API_KEY,
                pageNo: 1,
                numOfRows: 100,
                type: 'json'
            }
        });

        const items = response.data.response?.body?.items?.item || [];

        return items.map((item: any) => {
            const deadline = parseDate(item.rcptEndDt || item.endDate || item.deadline);
            const startDate = parseDate(item.rcptStaDt || item.startDate);

            return {
                id: `kstartup-${item.bizId || item.id || Math.random().toString(36).substr(2, 9)}`,
                program_id: item.bizId || item.id || '',
                title: item.bizNm || item.title || '제목 없음',
                agency: '창업진흥원',
                department: item.deptNm || undefined,
                deadline: deadline,
                start_date: startDate,
                end_date: deadline,
                status: determineStatus(deadline),
                d_day: deadline ? calculateDDay(deadline) : undefined,
                category: item.bizType ? [item.bizType] : ['창업지원'],
                tags: [item.targetInfo, item.bizType].filter(Boolean),
                budget: item.supportAmt || item.budget || undefined,
                description: item.bizSummary || item.description || '',
                link: item.linkUrl || item.url || undefined,
                requirements: item.targetInfo ? [item.targetInfo] : [],
                api_source: 'K-Startup'
            };
        });
    } catch (error: any) {
        console.error('K-Startup API Error:', error.message);
        return [];
    }
};
