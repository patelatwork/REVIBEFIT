import { useState } from 'react';
import { X, Image, Send, Hash } from 'lucide-react';

const categories = [
  { value: 'discussion', label: '💬 Discussion', desc: 'General chat' },
  { value: 'question', label: '❓ Question', desc: 'Ask the community' },
  { value: 'tip', label: '💡 Tip', desc: 'Share advice' },
  { value: 'motivation', label: '💪 Motivation', desc: 'Inspire others' },
  { value: 'transformation', label: '🔄 Transformation', desc: 'Share progress' },
  { value: 'success-story', label: '🌟 Success Story', desc: 'Your journey' },
];

const CreatePostModal = ({ isOpen, onClose, onSubmit }) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('discussion');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (tag && !tags.includes(tag) && tags.length < 5) {
        setTags([...tags, tag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5 - images.length);
    setImages([...images, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append('content', content.trim());
    formData.append('category', category);
    if (tags.length > 0) formData.append('tags', tags.join(','));
    images.forEach((img) => formData.append('images', img));

    await onSubmit(formData);
    setContent('');
    setCategory('discussion');
    setTags([]);
    setImages([]);
    setPreviews([]);
    setSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Create Post</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium text-center transition-all ${
                    category === cat.value
                      ? 'bg-[#225533] text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, ask a question, or inspire the community..."
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#3f8554] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3f8554]/20 text-sm resize-none transition-all"
              rows={5}
              maxLength={5000}
              required
            />
            <p className="text-xs text-gray-400 text-right mt-1">
              {content.length}/5000
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1 block">
              <Hash size={14} /> Tags (optional, max 5)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#3f8554]/10 text-[#3f8554] text-xs font-medium"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            {tags.length < 5 && (
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Type a tag and press Enter..."
                className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#3f8554] focus:outline-none text-sm transition-all"
              />
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1 block">
              <Image size={14} /> Images (optional, max 5)
            </label>
            <div className="flex flex-wrap gap-2">
              {previews.map((preview, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img src={preview} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#3f8554] hover:bg-[#3f8554]/5 transition-all">
                  <Image size={20} className="text-gray-400" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="w-full py-3 rounded-xl bg-[#225533] text-white font-semibold hover:bg-[#3f8554] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <Send size={16} /> Post to Community
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
