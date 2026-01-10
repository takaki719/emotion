'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocaleStore } from '@/stores/localeStore';
import { translations } from '@/lib/translations';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getApiUrl } from '@/utils/api';
import { getSavedPlayerName } from '@/utils/playerStorage';

// Edge Runtime 対応
export const runtime = 'edge';

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [customRoomId, setCustomRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [nameError, setNameError] = useState('');
  const [roomIdError, setRoomIdError] = useState('');
  const router = useRouter();
  const { locale } = useLocaleStore();
  const t = translations[locale];

  // 保存された名前を自動入力
  useEffect(() => {
    const savedName = getSavedPlayerName();
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  const validateInputs = () => {
    let isValid = true;
    setNameError('');
    setRoomIdError('');

    if (!playerName.trim()) {
      setNameError('プレイヤー名を入力してください');
      isValid = false;
    } else if (playerName.trim().length < 2) {
      setNameError('プレイヤー名は2文字以上で入力してください');
      isValid = false;
    }

    if (customRoomId.trim() && customRoomId.trim().length < 3) {
      setRoomIdError('合言葉は3文字以上で入力してください');
      isValid = false;
    }

    return isValid;
  };

  const createRoom = async () => {
    if (!validateInputs()) return;
    
    setIsCreating(true);
    try {
      const requestBody: any = {
        mode: 'basic',
        vote_type: '4choice',
        speaker_order: 'sequential',
        max_rounds: 1,
      };
      
      // Add custom room ID if provided
      if (customRoomId.trim()) {
        requestBody.room_id = customRoomId.trim();
      }

      const response = await fetch(`${getApiUrl()}/api/v1/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to create room' }));
        throw new Error(errorData.detail || 'Failed to create room');
      }

      const data = await response.json();
      
      // Only set host token and host flag for new rooms
      if (!data.isExistingRoom) {
        localStorage.setItem('hostToken', data.hostToken);
        router.push(`/room/${encodeURIComponent(data.roomId)}?name=${encodeURIComponent(playerName)}&host=true`);
      } else {
        // For existing rooms, join as regular participant
        router.push(`/room/${encodeURIComponent(data.roomId)}?name=${encodeURIComponent(playerName)}`);
      }
    } catch (error: any) {
      console.error('Error creating room:', error);
      alert(`${locale === 'ja' ? 'ルームの作成に失敗しました' : 'Failed to create room'}: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-xl">
        <div className="ink-wash ink-wash-accent -top-12 -left-8 h-32 w-52 rotate-[-8deg]" />
        <div className="ink-wash ink-wash-moss -bottom-16 -right-8 h-36 w-56 rotate-[10deg]" />

        <div className="paper-card relative overflow-hidden animate-fade-in">
          <div className="paper-header p-8 sm:p-10">
            <div className="flex items-center justify-between">
              <span className="ink-stamp">EMOGUCHI</span>
              <LanguageSwitcher />
            </div>
            <h1 className="font-display text-4xl sm:text-5xl mt-6 text-[rgb(var(--ink))]">
              {t.home.title}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[rgb(var(--ink-muted))]">
              {t.home.subtitle}
            </p>
          </div>

          <div className="p-8 sm:p-10 space-y-6">
            {/* Player Name Input */}
            <div>
              <label htmlFor="playerName" className="block text-xs uppercase tracking-[0.24em] text-[rgb(var(--ink-muted))] mb-2">
                {t.home.playerName}
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  if (nameError) setNameError('');
                }}
                className={`ink-input ${nameError ? 'ink-input-error' : ''}`}
                placeholder={t.home.playerNamePlaceholder}
                maxLength={20}
              />
              {nameError && (
                <div className="text-sm mt-2 text-[rgb(199,67,53)] animate-fade-in">
                  {nameError}
                </div>
              )}
            </div>

            {/* Room Input */}
            <div>
              <label htmlFor="customRoomId" className="block text-xs uppercase tracking-[0.24em] text-[rgb(var(--ink-muted))] mb-2">
                {t.home.customRoomId}
              </label>
              <input
                type="text"
                id="customRoomId"
                value={customRoomId}
                onChange={(e) => {
                  setCustomRoomId(e.target.value);
                  if (roomIdError) setRoomIdError('');
                }}
                className={`ink-input ${roomIdError ? 'ink-input-error' : ''}`}
                placeholder={t.home.customRoomIdPlaceholder}
                maxLength={20}
              />
              {roomIdError && (
                <div className="text-sm mt-2 text-[rgb(199,67,53)] animate-fade-in">
                  {roomIdError}
                </div>
              )}
              <p className="text-xs mt-3 text-[rgb(var(--ink-muted))]">
                {locale === 'ja' ? '空欄で新規作成、入力で既存ルームに参加' : 'Leave blank to create new room, enter to join existing room'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={createRoom}
                disabled={!playerName.trim() || isCreating || !!nameError || !!roomIdError}
                className="ink-button"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[rgb(var(--paper))] mr-2"></div>
                    <span className="animate-pulse">
                      {customRoomId.trim() ?
                        (locale === 'ja' ? '参加中...' : 'Joining...') :
                        (locale === 'ja' ? '作成中...' : 'Creating...')
                      }
                    </span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center">
                    {customRoomId.trim() && <span className="mr-2">🚪</span>}
                    {customRoomId.trim() ? t.home.joinRoom : t.home.createRoom}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-3 text-[0.62rem] uppercase tracking-[0.32em] text-[rgb(var(--ink-muted))]">
                <div className="h-px flex-1 bg-[rgba(var(--ink),0.12)]" />
                <span>{locale === 'ja' ? 'または' : 'or'}</span>
                <div className="h-px flex-1 bg-[rgba(var(--ink),0.12)]" />
              </div>

              {/* Solo Mode Button */}
              <button
                onClick={() => router.push('/solo')}
                className="ink-button-secondary"
              >
                {locale === 'ja' ? 'ソロ演技モード' : 'Solo Acting Mode'}
              </button>
            </div>

            {/* Footer */}
            <div className="pt-2 text-center text-sm text-[rgb(var(--ink-muted))]">
              <p>
                {locale === 'ja' ? (
                  <>スピーカーは指定された感情とセリフで演技し、<br/>リスナーは感情を推理するゲームです</>
                ) : (
                  <>Speakers perform with given emotions and scripts,<br/>Listeners guess the emotions</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
