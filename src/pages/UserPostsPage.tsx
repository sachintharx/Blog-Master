import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User, BookOpen } from 'lucide-react';
import PostCard from '../components/blog/PostCard';

interface Post {
  id: number;
  title: string;
  content: string;
  author_name: string;
  author_id: number;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

interface UserInfo {
  id: number;
  username: string;
  posts_count: number;
}

const UserPostsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPosts();
    fetchUserInfo();
  }, [id]);

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`/api/users/${id}/posts`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`/api/users/${id}`);
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-8">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">{userInfo.username}</h1>
                <div className="flex items-center space-x-2 text-indigo-100">
                  <BookOpen className="w-4 h-4" />
                  <span>{userInfo.posts_count} posts published</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600">This user hasn't published any posts yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPostsPage;