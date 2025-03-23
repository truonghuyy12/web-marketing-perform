import { Alert, Button, FileInput, Select, TextInput } from 'flowbite-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { toast } from 'react-toastify';

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '48rem',
    marginLeft: 'auto',
    marginRight: 'auto',
    minHeight: '100vh',
    borderRadius: '1rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    backgroundImage: 'linear-gradient(to bottom right, #f5f3ff, #eff6ff)',
  },
  title: {
    fontSize: '2.5rem', // Slightly larger title
    lineHeight: '2.8rem',
    textAlign: 'center',
    fontWeight: 800,
    color: '#7e22ce',
    letterSpacing: '-0.025em',
    marginBottom: '2.5rem', // More space below the title
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem', // Slightly larger gap between form elements
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  smInputGroup: {
    '@media (min-width: 640px)': {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  },
  input: {
    flex: '1 1 0%',
    borderRadius: '0.5rem',
    borderWidth: '2px',
    borderColor: '#ddd6fe',
    fontSize: '1.1rem', // Larger font size for input fields
    padding: '0.75rem', // Add some padding to the inputs
    transitionProperty: 'background-color, border-color, color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    ':focus': {
      borderColor: '#8b5cf6',
      outline: 'none',
    },
  },
  fileInputArea: {
    display: 'flex',
    gap: '1.25rem', // Larger gap in the file input area
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: '2px',
    borderStyle: 'dashed',
    borderColor: '#c4b5fd',
    padding: '1.25rem', // Larger padding in the file input area
    borderRadius: '0.75rem',
    backgroundColor: '#f5f3ff',
    transitionProperty: 'background-color, border-color, color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    ':hover': {
      backgroundColor: '#ede9fe',
    },
  },
  imageDisplay: {
    width: '100%',
    height: '20rem', // Slightly larger image display area
    objectFit: 'cover',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  reactQuillContainer: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
  },
  reactQuillEditor: {
    height: '20rem', // Slightly larger editor area
    marginBottom: '3.5rem', // More space below the editor
    borderBottomLeftRadius: '0.75rem',
    borderBottomRightRadius: '0.75rem',
    // Custom Quill Editor Styles
    '& .ql-editor': {
        minHeight: '200px', // Increased min-height
        fontSize: '1.15rem', // Increased font size
        lineHeight: '1.7',
        color: '#333',
    },

    '& .ql-container': {
        border: '1px solid #ccc',
    },

    '& .ql-toolbar': {
        backgroundColor: '#f0f0f0',
        borderBottom: '1px solid #ccc',
        padding: '10px', // Increased toolbar padding
    },

    '& .ql-toolbar button, & .ql-toolbar .ql-picker-label': {
        marginRight: '10px', // Increased spacing
        fontSize: '1.1rem', // Larger toolbar button font
    },
  },
  button: {
    borderRadius: '0.75rem',
    fontSize: '1.15rem', // Larger button font
    padding: '0.85rem 1.5rem', // add more padding to make the button bigger
    transitionProperty: 'box-shadow',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    ':hover': {
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
  },
};

export default function CreatePost() {
  const [file, setFile] = useState(null);
  const [imageUploadError, setImageUploadError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'other',
    image: null
  });
  const [publishError, setPublishError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  // const user = localStorage.getItem('user');


  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 2 * 1024 * 1024) {
        setImageUploadError('File size must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
        setImageUploadError(null);
      };
      reader.onerror = () => {
        setImageUploadError('Error reading file');
      };
      reader.readAsDataURL(selectedFile);
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.title || !formData.content) {
        setPublishError('Tiêu đề và nội dung là bắt buộc');
        return;
      }

      if (formData.title.length < 10) {
        setPublishError('Tiêu đề phải dài ít nhất 10 ký tự');
        return;
      }

      console.log('Submitting form data:', formData);

      // Verify the token is available
      if (!token) {
        setPublishError("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
        return;
      }

      const response = await axios.post(
        'posts/create',
        {
          title: formData.title,
          content: formData.content,
          category: formData.category,
          image: formData.image,
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

      console.log('Response:', response.data);

      if (response.data.success) {
        toast.success('Tạo bài viết thành công!');
        navigate('/dashboard');
      } else {
        toast.error(response.data.message || 'Không thể tạo bài viết');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      console.error('Thông tin lỗi chi tiết:', error.response); // In ra thông tin lỗi đầy đủ
      if(error.response && error.response.data && error.response.data.message){
        toast.error(error.response.data.message);
     } else {
        toast.error('Đã xảy ra lỗi khi tạo bài viết.');
     }
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Tạo bài viết mới</h1>
      <form style={styles.form} onSubmit={handleSubmit}>
        <div style={{...styles.inputGroup, ...styles.smInputGroup}}>
          <TextInput
            type='text'
            placeholder='Tiêu đề bài viết'
            required
            id='title'
            style={styles.input}
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            color='purple'
          />
          <Select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            color='purple'
            style={styles.input}
          >
            <option value='other'>Chọn danh mục</option>
            <option value='Marketing'>Marketing</option>
            <option value='Product'>Sản phẩm</option>
            <option value='Technology'>Thời đại công nghệ</option>
            <option value='Performance'>Tính Năng Hiệu Suất</option>
          </Select>
        </div>
        <div style={styles.fileInputArea}>
          <FileInput
            type='file'
            accept='image/*'
            onChange={handleFileChange}
            color='purple'
            style={{fontSize: '1.1rem'}} // Make the file input text a little bigger
          />
        </div>
        {imageUploadError && (
          <Alert color='failure' className='rounded-xl'>
            {imageUploadError}
          </Alert>
        )}
        {formData.image && (
          <img
            src={formData.image}
            alt='upload'
            style={styles.imageDisplay}
          />
        )}
        <div style={styles.reactQuillContainer}>
          <ReactQuill
            theme='snow'
            placeholder='Viết nội dung bài viết...'
            style={styles.reactQuillEditor}
            required
            value={formData.content}
            onChange={(value) => {
              setFormData({ ...formData, content: value });
            }}
          />
        </div>
        <Button type='submit' gradientDuoTone='purpleToPink' style={styles.button}>
          Đăng bài viết
        </Button>
        {publishError && (
          <Alert color='failure' className='mt-5 rounded-xl'>
            {publishError}
          </Alert>
        )}
      </form>
    </div>
  );
}