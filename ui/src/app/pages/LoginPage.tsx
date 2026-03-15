import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { User } from 'lucide-react';
import { findUser, saveUser, saveCurrentUser } from '../utils/storage';

function formatBirthDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}/${digits.slice(4)}`;
  return `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6)}`;
}

function toIsoBirthDate(value: string) {
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('/').map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !birthDate) {
      setError('이름과 생년월일을 모두 입력해 주세요.');
      return;
    }

    const isoBirthDate = toIsoBirthDate(birthDate);
    if (!isoBirthDate) {
      setError('생년월일은 yyyy/mm/dd 형식으로 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      let user = await findUser(name, isoBirthDate);
      if (!user) {
        user = await saveUser({ name, birthDate: isoBirthDate });
      }
      saveCurrentUser(user);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            주식 포트폴리오 관리
          </h2>
          <p className="text-center text-gray-600 mb-8">
            이름과 생년월일로 로그인해 주세요
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                이름
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                생년월일
              </label>
              <input
                type="text"
                id="birthDate"
                value={birthDate}
                onChange={(e) => setBirthDate(formatBirthDateInput(e.target.value))}
                inputMode="numeric"
                maxLength={10}
                autoComplete="bday"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                placeholder="yyyy/mm/dd"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? '처리 중...' : '로그인'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            처음 방문이면 자동으로 계정이 생성됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
