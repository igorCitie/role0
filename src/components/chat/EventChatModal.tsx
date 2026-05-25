"use client";

import { useEffect, useRef, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Box,
  Flex,
  Text,
  Avatar,
  Input,
  IconButton,
  Skeleton,
  Stack,
  useToast,
} from "@chakra-ui/react";
import { getChatHistory, sendChatMessage, type ChatMessage } from "@/lib/api/events";
import { ArrowRightIcon } from "@/components/icons";

interface EventChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  currentUserId: string;
}

export default function EventChatModal({
  isOpen,
  onClose,
  eventId,
  currentUserId,
}: EventChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  
  const token = typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";

  const fetchMessages = async (showLoading = false) => {
    if (!token || !isOpen) return;
    if (showLoading) setLoading(true);
    try {
      const msgs = await getChatHistory(eventId, token, 100);
      setMessages(msgs.reverse());
    } catch (err) {
      console.error("Failed to load chat", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages(true);
      const interval = setInterval(() => fetchMessages(false), 5000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, eventId, token]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !token || sending) return;
    
    setSending(true);
    try {
      await sendChatMessage(eventId, trimmed, token);
      setText("");
      await fetchMessages(false);
    } catch (err) {
      toast({
        title: "Erro ao enviar",
        description: err instanceof Error ? err.message : "Tente novamente",
        status: "error",
        duration: 3000,
        position: "top",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(isoString));
    } catch {
      return "";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" motionPreset="slideInBottom">
      <ModalOverlay />
      <ModalContent bg="#0d0d0f" borderRadius="0">
        <ModalHeader
          bg="surface.cardTranslucent"
          backdropFilter="blur(10px)"
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
          color="white"
          fontSize="md"
          fontWeight="700"
          textAlign="center"
          py={4}
        >
          Chat do Rolê
        </ModalHeader>
        <ModalCloseButton color="gray.400" top={3} right={4} />
        
        <ModalBody p={4} overflowY="auto" display="flex" flexDirection="column" gap={4}>
          {loading ? (
            <Stack spacing={4}>
              <Skeleton h="60px" w="70%" borderRadius="2xl" bg="whiteAlpha.100" startColor="whiteAlpha.50" endColor="whiteAlpha.200" />
              <Skeleton h="60px" w="70%" borderRadius="2xl" bg="whiteAlpha.100" startColor="whiteAlpha.50" endColor="whiteAlpha.200" alignSelf="flex-end" />
              <Skeleton h="60px" w="70%" borderRadius="2xl" bg="whiteAlpha.100" startColor="whiteAlpha.50" endColor="whiteAlpha.200" />
            </Stack>
          ) : messages.length === 0 ? (
            <Flex flex={1} justify="center" align="center" direction="column" color="gray.500">
              <Text fontSize="sm">Nenhuma mensagem ainda.</Text>
              <Text fontSize="xs">Seja o primeiro a mandar um oi!</Text>
            </Flex>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <Flex
                  key={msg.id}
                  direction="column"
                  align={isMe ? "flex-end" : "flex-start"}
                  w="100%"
                >
                  <Flex align="center" gap={2} mb={1} px={1}>
                    {!isMe && (
                      <Text fontSize="2xs" color="gray.500" fontWeight="bold">
                        {msg.senderNome}
                      </Text>
                    )}
                    <Text fontSize="2xs" color="gray.600">
                      {formatTime(msg.timestampEnvio)}
                    </Text>
                    {isMe && (
                      <Text fontSize="2xs" color="gray.500" fontWeight="bold">
                        Você
                      </Text>
                    )}
                  </Flex>
                  <Flex gap={2} maxW="85%" align="flex-end">
                    {!isMe && (
                      <Avatar
                        size="xs"
                        name={msg.senderNome}
                        bg="brand.900"
                        color="brand.200"
                        mb={1}
                      />
                    )}
                    <Box
                      bg={isMe ? "brand.500" : "surface.card"}
                      color={isMe ? "white" : "gray.100"}
                      px={4}
                      py={2}
                      borderRadius="2xl"
                      borderBottomRightRadius={isMe ? "sm" : "2xl"}
                      borderBottomLeftRadius={!isMe ? "sm" : "2xl"}
                      boxShadow="sm"
                    >
                      <Text fontSize="sm" wordBreak="break-word">
                        {msg.conteudo}
                      </Text>
                    </Box>
                  </Flex>
                </Flex>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </ModalBody>

        <ModalFooter
          bg="surface.cardTranslucent"
          backdropFilter="blur(10px)"
          borderTop="1px solid"
          borderColor="whiteAlpha.100"
          p={3}
          pb="max(12px, env(safe-area-inset-bottom))"
        >
          <Flex w="full" gap={2}>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva uma mensagem..."
              bg="surface.input"
              border="1px solid"
              borderColor="whiteAlpha.200"
              borderRadius="full"
              _focus={{ borderColor: "brand.500", boxShadow: "none" }}
              px={4}
              fontSize="sm"
            />
            <IconButton
              aria-label="Enviar"
              icon={<ArrowRightIcon size={18} />}
              bg="brand.500"
              color="white"
              borderRadius="full"
              isLoading={sending}
              onClick={handleSend}
              _hover={{ bg: "brand.400" }}
            />
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
