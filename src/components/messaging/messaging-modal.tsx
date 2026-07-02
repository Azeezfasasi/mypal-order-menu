/* eslint-disable react-hooks/exhaustive-deps */
import { ArrowLeft, Check, Loader2, SendHorizontal, User, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom';
import { Button } from '../ui/button';
import { BusinessMessagingApi } from '@/services/api/business-messaging-api';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface MessagingModalProps {
    onClose: () => void;
}

const MessagingModal = ({ onClose }: MessagingModalProps) => {

    const [currentScreen, setCurrentScreen] = useState<'ALL_CONVERSATION' | 'SINGLE_CONVERSATION'>('ALL_CONVERSATION')
    const [currentConversationId, setCurrentConversationId] = useState<number | null>(null)
    const [message, setMessage] = useState<string>('');

    const queryClient = useQueryClient();

    const { data: conversationList, isLoading } = BusinessMessagingApi.useGetBusinessConversation({
        page: 1,
        limit: 100,
    });

    const { data: conversationDetails, isLoading: isDetailsLoading } = BusinessMessagingApi.useGetConversationDetails({
        conversationId: currentConversationId || ''
    });

    // --- INVALDATE ALL BUSINESS MESSAGING QUERIES WHEN MODAL IS OPENED / RE-OPENED ---
    useEffect(() => {
        queryClient.invalidateQueries({
            queryKey: ["business-messages"]
        });

        return () => {
            setCurrentScreen('ALL_CONVERSATION');
            setCurrentConversationId(null);
        }
    }, []);

    const sendMessageMutation = BusinessMessagingApi.useSendMessage();
    const sendFirstMessageMutation = BusinessMessagingApi.useSendFirstMessage();

    // -- UTILITY FUNCTIONS ---
    const isUrl = (text: string) => {
        try {
            new URL(text);
            return true;
        } catch {
            return false;
        }
    };

    const isImageUrl = (url: string) => {
        return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
    };

    const getMessageType = (message: string) => {
        if (!isUrl(message)) return "TEXT";
        if (isImageUrl(message)) return "IMAGE";
        return "LINK";
    };

    function formatTimeTo12Hour(isoString: string): string {
        const date = new Date(isoString);

        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        }).toLowerCase();
    }

    const fetchConversationMessages = (id: number) => {
        setCurrentScreen('SINGLE_CONVERSATION');
        setCurrentConversationId(id)
    }

    const scrollContainer = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = (smooth = true) => {
        if (!scrollContainer.current) return;
        scrollContainer.current.scrollTo({
            top: scrollContainer.current.scrollHeight,
            behavior: smooth ? "smooth" : "auto",
        });
    };

    const goBack = () => {
        setCurrentConversationId(null);
        setCurrentScreen('ALL_CONVERSATION');
        setTimeout(() => {
            queryClient.invalidateQueries({
                queryKey: ["business-messages"]
            });
        }, 300)

    }

    // --- SCROLL MESSAGES CONTAINER TO BOTTOM WHEN THE LENGTH CHANGES ---
    useEffect(() => {
        if (conversationDetails?.data.messages?.length) {
            scrollToBottom(true);
        }
    }, [conversationDetails?.data.messages?.length]);

    const handleSendMessage = (conversationId: number) => {
        if (!message.trim) {
            toast.error('Enter message')
            return;
        }
        sendMessageMutation.mutate({
            conversationId: conversationId || '',
            data: {
                messageType: 'TEXT',
                message: message,
            }
        }, {
            onSuccess: () => {
                setMessage('');
            }
        })
    }

    const handleSendFirstMessage = () => {
        if (!message.trim) {
            toast.error('Enter message')
            return;
        }
        sendFirstMessageMutation.mutate({
            data: {
                messageType: 'TEXT',
                message: message,
            }
        }, {
            onSuccess: () => {
                setMessage('');
            }
        })
    }

    const [openSendFirstMessage, setOpenSendFirstMessage] = useState(false);

    return createPortal(
        <div onClick={onClose} className='fixed top-0 left-0 w-screen h-dvh bg-black/30 flex items-center justify-end z-[9999]'>
            <div onClick={(e) => e.stopPropagation()} className='fixed h-dvh p-1 bg-white right-0 top-0 w-full max-w-md shadow-md z-[10000]'>
                <div className='relative bg-[#142545] text-white p-3 h-[120px] rounded-[3px] flex flex-col justify-between'>
                    <h3 className='font-sora font-semibold text-[27px] text-[#AEB6C6]'>My<span className='text-[#923223]'>Pal</span></h3>
                    <div className=''>
                        <h4 className='font-sans font-bold text-[#C8CDD5] text-lg'>Admin communication channel</h4>
                        <p className='text-sm font-light'>Chat with our customer care representative</p>
                        <X className='text-white hover:text-[#DB3A07] absolute right-3 top-3 cursor-pointer' onClick={onClose} size={20} />
                    </div>
                </div>

                {/* --- SINGLE CONVERSATIONS --- */}
                {currentScreen === 'SINGLE_CONVERSATION' &&
                    <>
                        {isDetailsLoading ?
                            <div className="flex items-center justify-center gap-3 py-5 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading messages . . .
                            </div>
                            :
                            <>
                                <div ref={scrollContainer} className="h-[calc(100%-170px)] w-full pt-0 py-4 px-2 font-sans space-y-5 bg-white overflow-y-auto">
                                    <div onClick={goBack} className='fixed w-full bg-white py-3 flex items-center gap-2 text-sm hover:text-[#DB3A07] cursor-pointer border-b '>
                                        <ArrowLeft size={16} />
                                        Back
                                    </div>

                                    {/* --- SPACE BETWEEN FIRST MESSAGE AND TOP OF THE CONTAINER --- */}
                                    <div className='h-5 w-full bg-white' />

                                    {conversationDetails?.data.messages.map((msg) => {
                                        const isMe = msg.senderName !== 'Super Admin';

                                        return (
                                            <div key={msg.id} className={`flex items-start z-50 ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                                                <div className=' flex items-end gap-2'>
                                                    <div>
                                                        <div className={`p-3 ${isMe ? 'bg-[#1671D9]' : 'bg-[#F9FAFB]'} ${isMe ? 'text-white' : 'text-black'} font-manrope rounded-[8px] text-[13px]`}>
                                                            {msg.message}
                                                        </div>
                                                        <div className='flex items-center gap-2'>
                                                            <p className={`mt-1 text-[13px] text-[#344054] font-sans ${isMe ? 'text-right' : 'text-left'}`}>{msg.senderName} • {formatTimeTo12Hour(msg.createdAt)} </p>
                                                            {(isMe && msg.status === 'READ') &&
                                                                <div className=''>
                                                                    <Check size={20} />
                                                                </div>
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                                {isMe && <div className='w-10 h-10 bg-[#FFECE5] flex items-center justify-center rounded-full'>
                                                    <User size={17} />
                                                </div>}
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className='h-[50px] flex items-stretch'>
                                    {/* <input type='text' value={message} onChange={(e) => setMessage(e.target.value)} className='flex-1 h-full rounded-[5px_0_0_5px] border border-[#C4C4C4] px-3 text-sm' placeholder='Type your message here . . .' /> */}
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={1}
                                        placeholder="Type your message here..."
                                        className="w-full resize-none rounded-[5px_0_0_5px] bg-white px-4 py-3 text-sm shadow-none focus:outline-none focus:ring-0 h-full border border-[#C4C4C4]"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                if (conversationDetails?.data.adminId) {
                                                    handleSendMessage(conversationDetails?.data.id);
                                                }
                                            }
                                        }}
                                    />
                                    <Button onClick={conversationDetails?.data.adminId ? () => handleSendMessage(conversationDetails?.data.id) : () => { }} className='bg-[#DE5126] text-white h-full w-[50px] rounded-[0_5px_5px_0]'>
                                        <SendHorizontal />
                                    </Button>
                                </div>
                            </>
                        }
                    </>
                }

                {/* --- CONVERSATION LIST --- */}
                {currentScreen === 'ALL_CONVERSATION' &&
                    <>
                        {isLoading ?
                            <div className="flex items-center justify-center gap-3 py-5 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading conversations . . .
                            </div>
                            :
                            // --- IF NO CONVERSATION AVAILABLE ---
                            conversationList?.data.data.length === 0 ?
                                <div className='h-[calc(100%-120px)]'>
                                    {!openSendFirstMessage ?
                                        <button onClick={() => setOpenSendFirstMessage(prev => !prev)} className='w-fit bg-[#DE5126] py-2.5 px-5 rounded-[5px] text-sm font-medium text-white mt-4 block mx-auto'>Chat with Internal Admin</button>
                                        :
                                        <div className='flex flex-col justify-between h-full'>
                                            <div onClick={() => setOpenSendFirstMessage(prev => !prev)} className='w-full bg-white py-3 flex items-center gap-2 text-sm hover:text-[#DB3A07] cursor-pointer border-b '>
                                                <ArrowLeft size={16} />
                                                Back
                                            </div>
                                            <div className='h-[50px] flex items-stretch'>
                                                <textarea
                                                    value={message}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                    rows={1}
                                                    placeholder="Type your message here..."
                                                    className="w-full resize-none rounded-[5px_0_0_5px] bg-white px-4 py-3 text-sm shadow-none focus:outline-none focus:ring-0 h-full border border-[#C4C4C4]"
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendFirstMessage();
                                                        }
                                                    }}
                                                />
                                                <Button onClick={handleSendFirstMessage} className='bg-[#DE5126] text-white h-full w-[50px] rounded-[0_5px_5px_0]'>
                                                    <SendHorizontal />
                                                </Button>
                                            </div>
                                        </div>
                                    }
                                </div>
                                :
                                conversationList?.data.data.map((c) => (
                                    <div key={c.id} onClick={() => fetchConversationMessages(c.id)} className="cursor-pointer w-full px-4 hover:bg-gray-50 py-5 border-b border-gray-200 grid grid-cols-[40px_auto] items-center gap-3">
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage src={undefined} />
                                            <AvatarFallback>
                                                {(c.admin?.name || "N/A")[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="w-full relative flex-1 flex justify-between">
                                            <div className="w-full">
                                                <div className="font-medium">
                                                    {c.admin?.name || "N/A"}
                                                </div>
                                                <p className="w-[80%] text-xs text-gray-500 truncate">
                                                    {getMessageType(c.latestMessage?.message) === 'TEXT' ?
                                                        c.latestMessage?.message.slice(0, 70) // to cut the text short before tailwind truncating
                                                        :
                                                        getMessageType(c.latestMessage?.message).toLocaleLowerCase()
                                                    }
                                                </p>
                                            </div>
                                            <div className="absolute right-1.5 h-fit top-1/2 -translate-y-1/2">

                                                {c.unreadCount > 0 ?
                                                    <div>
                                                        <p className="text-xs text-[#F56630] font-semibold mb-1">{formatTimeTo12Hour(c?.latestMessage?.createdAt)}</p>
                                                        <div className="w-fit block mx-auto text-xs h-fit bg-[#F56630] text-white px-2 py-0.5 rounded-full">
                                                            {c.unreadCount}
                                                        </div>
                                                    </div>
                                                    :
                                                    <p className="text-xs text-[#101928] font-semibold mb-1">{formatTimeTo12Hour(c?.latestMessage?.createdAt)}</p>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                ))
                        }
                    </>
                }

            </div>
        </div>,
        document.body
    );
}

export default MessagingModal