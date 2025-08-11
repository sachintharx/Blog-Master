import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Tag, ExternalLink } from 'lucide-react';

interface Post {
  id: number;
  title: string;
  excerpt: string;
  author: {
    id: number;
    username: string;
    avatar: string;
  };
  createdAt: string;
  tags: string[];
  featuredImage?: string;
}

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <article className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Featured Image */}
      {post.featuredImage && (
        <div className="h-48 overflow-hidden">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-6">
        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
          <Link to={`/post/${post.id}`} className="hover:underline">
            {post.title}
          </Link>
        </h2>

        {/* Excerpt */}
        <p className="text-gray-600 mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-600 text-sm rounded-full font-medium"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="text-sm text-gray-500 px-2 py-1">
                +{post.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <img
              src={post.author.avatar}
              alt={post.author.username}
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="text-sm">
              <Link 
                to={`/user/${post.author.id}/posts`}
                className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
              >
                {post.author.username}
              </Link>
              <div className="flex items-center text-gray-500 gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(post.createdAt)}
              </div>
            </div>
          </div>

          <Link
            to={`/post/${post.id}`}
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors group"
          >
            Read More
            <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default PostCard;