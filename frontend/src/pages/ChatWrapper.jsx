import { useLocation, useNavigate } from 'react-router-dom';
import ChatPage from './ChatPage';

export default function ChatPageWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tripId, customerId, customerName } = location.state || {};
  
  return (
    <ChatPage
      tripId={tripId}
      customerId={customerId}
      customerName={customerName}
      onBack={() => navigate(-1)}
    />
  );
}