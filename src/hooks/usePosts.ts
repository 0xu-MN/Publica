import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommunityPost, mockCommunityPosts } from '../data/mockData';

const POSTS_STORAGE_KEY = 'community_posts';

export const usePosts = () => {
    const [posts, setPosts] = useState<CommunityPost[]>(mockCommunityPosts);
    const [loading, setLoading] = useState(true);

    // Load posts from storage on mount
    useEffect(() => {
        const loadPosts = async () => {
            try {
                const storedPosts = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
                if (storedPosts) {
                    setPosts(JSON.parse(storedPosts));
                }
            } catch (error) {
                console.error('Failed to load posts:', error);
            } finally {
                setLoading(false);
            }
        };
        loadPosts();
    }, []);

    // Save posts to storage whenever they change
    const savePosts = useCallback(async (newPosts: CommunityPost[]) => {
        try {
            setPosts(newPosts);
            await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(newPosts));
        } catch (error) {
            console.error('Failed to save posts:', error);
        }
    }, []);

    const addPost = useCallback(async (newPost: CommunityPost) => {
        const updatedPosts = [newPost, ...posts];
        await savePosts(updatedPosts);
    }, [posts, savePosts]);

    const deletePost = useCallback(async (postId: string) => {
        const updatedPosts = posts.filter(p => p.id !== postId);
        await savePosts(updatedPosts);
    }, [posts, savePosts]);

    const updatePost = useCallback(async (postId: string, updates: Partial<CommunityPost>) => {
        const updatedPosts = posts.map(p =>
            p.id === postId ? { ...p, ...updates } : p
        );
        await savePosts(updatedPosts);
    }, [posts, savePosts]);

    const toggleLike = useCallback(async (postId: string, userId?: string) => {
        if (!userId) return; // Cannot like without user ID

        const updatedPosts = posts.map(p => {
            if (p.id === postId) {
                const likedBy = p.likedBy || [];
                const isLiked = likedBy.includes(userId);

                if (isLiked) {
                    return {
                        ...p,
                        likes: Math.max(0, p.likes - 1),
                        likedBy: likedBy.filter(id => id !== userId)
                    };
                } else {
                    return {
                        ...p,
                        likes: p.likes + 1,
                        likedBy: [...likedBy, userId]
                    };
                }
            }
            return p;
        });
        await savePosts(updatedPosts);
    }, [posts, savePosts]);

    const addComment = useCallback(async (postId: string, comment: { author: string, content: string, isAnonymous: boolean }) => {
        const newComment = {
            id: `cmt_${Date.now()}`,
            timestamp: '방금 전',
            ...comment
        };

        const updatedPosts = posts.map(p =>
            p.id === postId ? {
                ...p,
                comments: p.comments + 1,
                commentsList: [newComment, ...(p.commentsList || [])]
            } : p
        );
        await savePosts(updatedPosts);
    }, [posts, savePosts]);

    const deleteComment = useCallback(async (postId: string, commentId: string) => {
        const updatedPosts = posts.map(p => {
            if (p.id === postId) {
                const updatedComments = (p.commentsList || []).filter(c => c.id !== commentId);
                return {
                    ...p,
                    comments: Math.max(0, p.comments - 1),
                    commentsList: updatedComments
                };
            }
            return p;
        });
        await savePosts(updatedPosts);
    }, [posts, savePosts]);

    const toggleScrap = useCallback(async (postId: string) => {
        const updatedPosts = posts.map(p =>
            p.id === postId ? { ...p, scrapped: !p.scrapped } : p
        );
        await savePosts(updatedPosts);
    }, [posts, savePosts]);

    return { posts, loading, addPost, deletePost, updatePost, toggleLike, toggleScrap, addComment, deleteComment };
};
