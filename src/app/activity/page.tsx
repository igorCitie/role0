"use client";

import { useEffect, useState } from "react";
import { Box, Flex, Text, Avatar, Spinner, Heading } from "@chakra-ui/react";
import AuthGuard from "@/components/auth/AuthGuard";
import BottomNav from "@/components/layout/BottomNav";
import { getMyEvents, listRequests } from "@/lib/api/events";
import { getUserReviews } from "@/lib/api/users";


export type ActivityItem = {
  id: string;
  type: "JOIN_REQUEST" | "REVIEW" | "EVENT_UPDATE";
  title: string;
  subtitle: string;
  timestamp: Date;
  meta?: any;
};

function getRelativeTime(date: Date) {
  const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (diff < 60) return "Agora mesmo";
  if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Há ${Math.floor(diff / 3600)} h`;
  return `Há ${Math.floor(diff / 86400)} d`;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        if (!token || !userId) return;

        const items: ActivityItem[] = [];
        
        // Parallel fetch for events and reviews
        const [events, reviews] = await Promise.all([
          getMyEvents(token).catch(() => []),
          getUserReviews(userId, token).catch(() => ({ avaliacoes: [] }))
        ]);

        // Process Reviews
        reviews.avaliacoes.forEach(r => {
          items.push({
            id: `rev_${r.id}`,
            type: "REVIEW",
            title: `Nova avaliação recebida`,
            subtitle: `Nota: ${r.nota}/5. ${r.comentario ? `"${r.comentario}"` : ""}`,
            timestamp: new Date() // Fake timestamp for MVP if missing
          });
        });

        // Process Host Events Requests
        const hostEvents = events.filter(e => e.isHost && (e.status === "CRIADO" || e.status === "ABERTO_PARA_VAGAS"));
        
        const requestsPromises = hostEvents.map(ev => 
          listRequests(ev.id, token)
            .then(reqs => reqs.map(req => ({ req, ev })))
            .catch(() => [])
        );
        
        const allRequests = (await Promise.all(requestsPromises)).flat();
        
        allRequests.forEach(({ req, ev }) => {
          const anyReq = req as any;
          items.push({
            id: `req_${anyReq.solicitacaoId || anyReq.id}`,
            type: "JOIN_REQUEST",
            title: `${anyReq.usuarioNome || 'Um usuário'} pediu para participar`,
            subtitle: `Em: ${ev.titulo}`,
            timestamp: new Date() // Fake timestamp for MVP if missing
          });
        });

        // Process Event Updates for events user is participating in
        const participantEvents = events.filter(e => !e.isHost && (e.status === "CANCELADO" || e.status === "EXPIRADO"));
        participantEvents.forEach(ev => {
          items.push({
            id: `ev_upd_${ev.id}`,
            type: "EVENT_UPDATE",
            title: `Rolê ${ev.status === "CANCELADO" ? "cancelado" : "encerrado"}`,
            subtitle: ev.titulo,
            timestamp: new Date(ev.horarioInicio)
          });
        });

        // Sort by timestamp desc
        items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setActivities(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, []);

  return (
    <AuthGuard>
      <Box w="100%" minH="100dvh" bg="surface.bg" pb="100px">
        <Flex
          align="center"
          px={4}
          pt={6}
          pb={4}
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
          position="sticky"
          top={0}
          bg="surface.bg"
          zIndex={10}
        >
          <Heading size="md" color="white" fontWeight="600">
            Atividade
          </Heading>
        </Flex>

        <Box px={4} py={6}>
          {loading ? (
            <Flex justify="center" py={10}>
              <Spinner color="brand.500" />
            </Flex>
          ) : activities.length === 0 ? (
            <Flex direction="column" align="center" justify="center" py={20} gap={3}>
              <Text color="gray.500" fontSize="sm" textAlign="center">
                Você ainda não tem notificações.
              </Text>
            </Flex>
          ) : (
            <Flex direction="column" gap={3}>
              {activities.map(act => (
                <Flex
                  key={act.id}
                  p={4}
                  bg="surface.card"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  borderRadius="12px"
                  align="center"
                  gap={4}
                  transition="background 0.2s"
                  _hover={{ bg: "whiteAlpha.50" }}
                  cursor="pointer"
                >
                  <Avatar 
                    size="sm" 
                    bg={act.type === "JOIN_REQUEST" ? "brand.500" : act.type === "REVIEW" ? "yellow.500" : "gray.600"} 
                    icon={undefined} // Let default icon show or we could use custom icons
                  />
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="bold" color="white">
                      {act.title}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      {act.subtitle}
                    </Text>
                  </Box>
                  <Text fontSize="10px" color="gray.500">
                    {getRelativeTime(act.timestamp)}
                  </Text>
                </Flex>
              ))}
            </Flex>
          )}
        </Box>
        <BottomNav />
      </Box>
    </AuthGuard>
  );
}
