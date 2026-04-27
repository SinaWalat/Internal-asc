'use client';

import React, { useState } from 'react';
import { ChatList } from '@/components/chat/chat-list';
import { ChatWindow } from '@/components/chat/chat-window';
import { useUser } from '@/firebase/client';
import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { NewChatDialog } from '@/components/chat/new-chat-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export default function AdminChatPage() {
    const { user } = useUser();
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'custom'>('today');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Live Support</h1>
                    <p className="text-muted-foreground">Chat with students in real-time.</p>
                </div>
                {user && (
                    <NewChatDialog
                        currentUserId={user.uid}
                        currentUserName={user.displayName || 'Admin'}
                        onChatCreated={setSelectedChatId}
                    />
                )}
            </div>

            <div className="grid flex-1 gap-4 min-h-0 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr]">
                {/* Chat List Sidebar */}
                <Card className="flex flex-col overflow-hidden">
                    <div className="p-4 border-b bg-muted/40 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Conversations
                            </h2>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Select
                                value={dateFilter}
                                onValueChange={(val: any) => setDateFilter(val)}
                            >
                                <SelectTrigger className="w-full h-8 text-xs">
                                    <SelectValue placeholder="Filter by date" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="7days">Last 7 days</SelectItem>
                                    <SelectItem value="30days">Last 30 days</SelectItem>
                                    <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                            </Select>

                            {dateFilter === 'custom' && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="date"
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal h-8 text-xs",
                                                !dateRange && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-3 w-3" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                    <>
                                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                                        {format(dateRange.to, "LLL dd, y")}
                                                    </>
                                                ) : (
                                                    format(dateRange.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={dateRange?.from}
                                            selected={dateRange}
                                            onSelect={setDateRange}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <ChatList
                            onSelectChat={setSelectedChatId}
                            selectedChatId={selectedChatId}
                            currentUserId={user?.uid}
                            dateFilter={dateFilter}
                            customDateRange={dateRange ? { from: dateRange.from, to: dateRange.to } : undefined}
                        />
                    </div>
                </Card>

                {/* Chat Window Area */}
                <Card className="flex flex-col overflow-hidden">
                    {selectedChatId && user ? (
                        <ChatWindow
                            chatId={selectedChatId}
                            currentUserId={user.uid}
                            currentUserName={user.displayName || 'Admin'}
                            className="border-0 h-full rounded-none"
                            isAdminView={true}
                        />
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                            <p>Select a conversation to start chatting</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
