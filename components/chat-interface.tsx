'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, Search, Plus, Download, Upload, Trash2, UserPlus, X, ChevronRight, MoreVertical, Star, Settings } from 'lucide-react'
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// Define interfaces
interface Model {
  id: string;
  name: string;
  description: string;
}

interface SelectedModel {
  id: string;
  active: boolean;
  customInstruction: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Room {
  id: string;
  name: string;
  messages: Message[];
  selectedModels: SelectedModel[];
}

interface ChatInterfaceState {
  activeTab: string;
  rooms: Room[];
  promptLibrary: string;
  models: Model[];
  selectedModels: SelectedModel[];
  chatMessages: Message[];
  isUploading: boolean;
  currentMessage: string;
  isModelSelectionOpen: boolean;
  isSidebarOpen: boolean;
  searchTerm: string;
  activeRoom: number;
  modelSearchTerm: string;
  favoriteModels: string[];
}

interface SelectedModelsProps {
  models: Model[];
  selectedModels: SelectedModel[];
  onRemove: (modelId: string) => void;
  onToggle: (modelId: string) => void;
  onCustomInstruction: (modelId: string, instruction: string) => void;
}

export function ChatInterfaceComponent() {
  const [state, setState] = useState<ChatInterfaceState>({
    activeTab: 'chat', // Ubah ini dari 'browse' ke 'chat'
    rooms: [{
      id: '1',
      name: 'New Room',
      messages: [],
      selectedModels: []
    }],
    promptLibrary: '',
    models: [],
    selectedModels: [],
    chatMessages: [],
    isUploading: false,
    currentMessage: '',
    isModelSelectionOpen: false,
    isSidebarOpen: true,
    searchTerm: '',
    activeRoom: 0,
    modelSearchTerm: '',
    favoriteModels: [],
  });

  const { toast } = useToast();

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          }
        });
        if (!response.ok) throw new Error('Failed to fetch models');
        const data = await response.json();
        setState(prev => ({ ...prev, models: data.data }));
      } catch (error) {
        console.error('Error fetching models:', error);
        toast({
          title: "Error",
          description: "Failed to fetch models. Please try again later.",
          variant: "destructive",
        });
      }
    };

    fetchModels();
    loadFavoriteModels();
  }, []); 

  useEffect(() => {
    saveFavoriteModels();
  }, [state.favoriteModels]);

  const loadFavoriteModels = () => {
    const savedFavorites = localStorage.getItem('favoriteModels');
    if (savedFavorites) {
      setState(prev => ({ ...prev, favoriteModels: JSON.parse(savedFavorites) }));
    }
  };

  const saveFavoriteModels = () => {
    localStorage.setItem('favoriteModels', JSON.stringify(state.favoriteModels));
  };

  const addRoom = () => {
    setState(prev => ({ ...prev, isModelSelectionOpen: true }));
  };

  const createNewRoom = () => {
    if (state.selectedModels.length > 0) {
      setState(prev => ({
        ...prev,
        rooms: [...prev.rooms, {
          id: Date.now().toString(),
          name: `New Room (${prev.selectedModels.length} models)`,
          messages: [],
          selectedModels: [...prev.selectedModels]
        }],
        isModelSelectionOpen: false
      }));
    } else {
      toast({
        title: "No Models Selected",
        description: "Please select at least one model before adding a room.",
        variant: "destructive",
      });
    }
  };

  const handleModelSelect = (modelId: string) => {
    setState(prev => ({
      ...prev,
      selectedModels: prev.selectedModels.some(model => model.id === modelId)
        ? prev.selectedModels.filter(model => model.id !== modelId)
        : [...prev.selectedModels, { id: modelId, active: true, customInstruction: '' }]
    }));
  };

  const toggleModelActive = (modelId: string) => {
    setState(prev => ({
      ...prev,
      selectedModels: prev.selectedModels.map(model => 
        model.id === modelId ? { ...model, active: !model.active } : model
      )
    }));
  };

  const clearChat = () => {
    setState(prev => ({ ...prev, chatMessages: [] }));
    toast({
      title: "Chat Cleared",
      description: "All chat messages have been removed.",
    });
  };

  const clearModels = () => {
    setState(prev => ({ ...prev, selectedModels: [] }));
    toast({
      title: "Models Cleared",
      description: "All selected models have been cleared.",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState(prev => ({ ...prev, isUploading: true }));
    // Implement your file upload logic here
    // For example:
    // const formData = new FormData()
    // formData.append('file', file)
    // await fetch('your-upload-endpoint', { method: 'POST', body: formData })

    setState(prev => ({ ...prev, isUploading: false }));
    toast({
      title: "File Uploaded",
      description: `${file.name} has been successfully uploaded.`,
    });
  };

  const sendMessage = async () => {
    if (state.currentMessage.trim() && state.selectedModels.length > 0) {
      const newMessage = { role: 'user' as const, content: state.currentMessage };
      setState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, newMessage], currentMessage: '' }));

      setState(prev => ({
        ...prev,
        rooms: prev.rooms.map((room, index) =>
          index === prev.activeRoom ? { ...room, messages: [...room.messages, newMessage] } : room
        )
      }));

      try {
        const responses = await Promise.all(state.selectedModels
          .filter(model => model.active)
          .map(async ({ id: modelId, customInstruction }) => {
          try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'KukaChat',
              },
              body: JSON.stringify({
                model: modelId,
                messages: [{ role: 'user', content: customInstruction ? `${customInstruction}\n${state.currentMessage}` : state.currentMessage }],
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            if (!data || !data.choices || data.choices.length === 0) {
              throw new Error(`Invalid response from model ${modelId}`);
            }
            return { modelId, content: data.choices[0].message.content };
          } catch (error) {
            console.error(`Error with model ${modelId}:`, error);
            return { modelId, content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
          }
        }));

        responses.forEach(({ modelId, content }) => {
          const assistantMessage = { role: 'assistant' as const, content: `[${modelId}]: ${content}` };
          setState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, assistantMessage] }));
          setState(prev => ({
            ...prev,
            rooms: prev.rooms.map((room, index) =>
              index === prev.activeRoom ? { ...room, messages: [...room.messages, assistantMessage] } : room
            )
          }));
        });
      } catch (error) {
        console.error('Error getting model responses:', error);
        toast({
          title: "Error",
          description: "Failed to get responses from the model(s). Please try again.",
          variant: "destructive",
        });
      }
    } else if (state.selectedModels.length === 0) {
      toast({
        title: "No Models Selected",
        description: "Please select at least one model before sending a message.",
        variant: "destructive",
      });
    }
  };

  const removeSelectedModel = (modelId: string) => {
    setState(prev => ({ ...prev, selectedModels: prev.selectedModels.filter(model => model.id !== modelId) }));
  };

  const handleRenameRoom = (index: number) => {
    const newName = prompt("Enter new name for the room:", state.rooms[index].name);
    if (newName) {
      setState(prev => ({
        ...prev,
        rooms: prev.rooms.map((room, i) =>
          i === index ? { ...room, name: newName } : room
        )
      }));
    }
  };

  const handleDeleteRoom = (index: number) => {
    if (state.rooms.length > 1 && confirm("Are you sure you want to delete this room?")) {
      setState(prev => ({
        ...prev,
        rooms: prev.rooms.filter((_, i) => i !== index),
        activeRoom: index === prev.activeRoom ? 0 : prev.activeRoom,
        chatMessages: index === prev.activeRoom ? state.rooms[0].messages : prev.chatMessages,
        selectedModels: index === prev.activeRoom ? state.rooms[0].selectedModels : prev.selectedModels
      }));
    } else if (state.rooms.length === 1) {
      toast({
        title: "Cannot Delete",
        description: "You must have at least one chat room.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, searchTerm: e.target.value }));
  };

  const filteredRooms = state.rooms.filter(room => 
    room.name.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  const createNewChat = () => {
    const newRoom: Room = {
      id: Date.now().toString(),
      name: `New Chat ${state.rooms.length + 1}`,
      messages: [],
      selectedModels: []
    };
    setState(prev => ({
      ...prev,
      rooms: [newRoom, ...prev.rooms],
      activeRoom: 0,
      chatMessages: [],
      selectedModels: []
    }));
  };

  const switchRoom = (index: number) => {
    setState(prev => ({
      ...prev,
      activeRoom: index,
      chatMessages: prev.rooms[index].messages,
      selectedModels: prev.rooms[index].selectedModels
    }));
  };

  const toggleFavoriteModel = (modelId: string) => {
    setState(prev => ({
      ...prev,
      favoriteModels: prev.favoriteModels.includes(modelId)
        ? prev.favoriteModels.filter(id => id !== modelId)
        : [...prev.favoriteModels, modelId]
    }));
  };

  const handleCustomInstruction = (modelId: string, instruction: string) => {
    setState(prev => ({
      ...prev,
      selectedModels: prev.selectedModels.map(model =>
        model.id === modelId ? { ...model, customInstruction: instruction } : model
      )
    }));
  };

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className={`bg-white border-r transition-all duration-300 ${state.isSidebarOpen ? 'w-64' : 'w-0'} h-full`}>
        {state.isSidebarOpen && (
          <>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <ChevronLeft className="w-6 h-6 mr-2 cursor-pointer" onClick={() => setState(prev => ({ ...prev, isSidebarOpen: false }))} />
                <span className="font-semibold">Kuka Chat</span>
              </div>
              <Button variant="outline" size="sm" onClick={createNewChat}>
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>
            <div className="p-4">
              <Input 
                type="text" 
                placeholder="Search chats" 
                className="w-full" 
                value={state.searchTerm}
                onChange={handleSearch}
              />
            </div>
            <ScrollArea className="h-[calc(100vh-180px)]">
              {state.rooms.map((room, index) => (
                <div 
                  key={room.id} 
                  className={`px-4 py-2 hover:bg-gray-100 flex items-center justify-between cursor-pointer ${
                    index === state.activeRoom ? 'bg-gray-200' : ''
                  }`}
                  onClick={() => switchRoom(index)}
                >
                  <span>{room.name}</span>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">{room.messages.length}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleRenameRoom(index)}>
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDeleteRoom(index)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Tabs value={state.activeTab} onValueChange={value => setState(prev => ({ ...prev, activeTab: value }))} className="flex-1 flex flex-col">
          <header className="bg-white border-b p-4 flex items-center">
            {!state.isSidebarOpen && (
              <ChevronRight className="w-6 h-6 mr-2 cursor-pointer" onClick={() => setState(prev => ({ ...prev, isSidebarOpen: true }))} />
            )}
            <TabsList>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="rankings">Rankings</TabsTrigger>
              <TabsTrigger value="docs">Docs</TabsTrigger>
            </TabsList>
          </header>

          <div className="flex-1 overflow-hidden flex flex-col">
            <TabsContent value="chat" className="flex-1 flex flex-col">
              {/* Add SelectedModels component here */}
              <SelectedModels 
                models={state.models} 
                selectedModels={state.selectedModels} 
                onRemove={removeSelectedModel}
                onToggle={toggleModelActive}
                onCustomInstruction={handleCustomInstruction}
              />

              {/* Chat messages */}
              <ScrollArea className="flex-1">
                {state.chatMessages.map((message, index) => (
                  <div key={index} className={`mb-4 p-4 rounded-lg border-2 ${
                    message.role === 'user' 
                      ? 'bg-gray-200 ml-auto border-gray-400'
                      : 'bg-white border-gray-300'
                  }`} style={{maxWidth: '80%'}}>
                    {message.role === 'assistant' && (
                      <div className="font-semibold text-sm text-gray-600 mb-2">
                        {message.content.split(':')[0]}
                      </div>
                    )}
                    <p className={message.role === 'user' ? 'text-gray-800' : 'text-gray-800'}>
                      {message.role === 'assistant' 
                        ? message.content.split(':').slice(1).join(':').trim() 
                        : message.content
                      }
                    </p>
                  </div>
                ))}
              </ScrollArea>

              {/* Input Area */}
              <div className="bg-white border-t p-4">
                <div className="flex items-center mb-2 space-x-2">
                  <Dialog open={state.isModelSelectionOpen} onOpenChange={open => setState(prev => ({ ...prev, isModelSelectionOpen: open }))}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={addRoom}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add models
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Select Models</DialogTitle>
                      </DialogHeader>
                      <Input
                        type="text"
                        placeholder="Search models..."
                        value={state.modelSearchTerm}
                        onChange={(e) => setState(prev => ({ ...prev, modelSearchTerm: e.target.value }))}
                        className="mb-4"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 max-h-[60vh] overflow-y-auto">
                        {state.models
                          .filter(model => model.name.toLowerCase().includes(state.modelSearchTerm.toLowerCase()))
                          .sort((a, b) => {
                            if (state.favoriteModels.includes(a.id) && !state.favoriteModels.includes(b.id)) return -1;
                            if (!state.favoriteModels.includes(a.id) && state.favoriteModels.includes(b.id)) return 1;
                            return 0;
                          })
                          .map((model) => (
                            <div key={model.id} className="flex items-start space-x-3 p-3 border rounded hover:bg-gray-50">
                              <Checkbox
                                id={`checkbox-${model.id}`}
                                checked={state.selectedModels.some(m => m.id === model.id)}
                                onCheckedChange={() => handleModelSelect(model.id)}
                                className="mt-1"
                              />
                              <div className="flex-grow">
                                <div className="flex items-center justify-between">
                                  <label htmlFor={`checkbox-${model.id}`} className="font-medium cursor-pointer">
                                    {model.name}
                                  </label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleFavoriteModel(model.id)}
                                    className={state.favoriteModels.includes(model.id) ? "text-yellow-500" : "text-gray-500"}
                                  >
                                    <Star className="w-4 h-4" />
                                  </Button>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{model.description}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                      <DialogFooter>
                        <Button onClick={createNewRoom}>Create Room</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" onClick={clearChat}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Chat
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearModels}>
                    <X className="w-4 h-4 mr-2" />
                    Clear Models
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload File
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload File</DialogTitle>
                      </DialogHeader>
                      <Input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={state.isUploading}
                      />
                      {state.isUploading && <p>Uploading...</p>}
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Type your message..."
                    value={state.currentMessage}
                    onChange={(e) => setState(prev => ({ ...prev, currentMessage: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button variant="default" onClick={sendMessage}>Send</Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="rankings" className="flex-1 overflow-auto p-4">
              {/* Add rankings content */}
            </TabsContent>
            <TabsContent value="docs" className="flex-1 overflow-auto p-4">
              {/* Add docs content */}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

const SelectedModels: React.FC<SelectedModelsProps> = ({ models, selectedModels, onRemove, onToggle, onCustomInstruction }) => {
  return (
    <Accordion type="single" collapsible className="w-full bg-white border-b">
      <AccordionItem value="selected-models">
        <AccordionTrigger className="px-4 py-2">
          Selected Models ({selectedModels.length})
        </AccordionTrigger>
        <AccordionContent>
          {selectedModels.map(({ id: modelId, active, customInstruction }) => {
            const model = models.find(m => m.id === modelId);
            return (
              <div key={modelId} className="p-2 border-b last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{model?.name || modelId}</span>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={active}
                      onCheckedChange={() => onToggle(modelId)}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onRemove(modelId)}
                      className="p-1"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <textarea
                  className="w-full p-2 border rounded text-sm"
                  rows={2}
                  value={customInstruction}
                  onChange={(e) => onCustomInstruction(modelId, e.target.value)}
                  placeholder="Enter custom instructions for this model..."
                />
              </div>
            );
          })}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};