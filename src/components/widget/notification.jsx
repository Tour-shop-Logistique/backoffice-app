import ReactDOM from 'react-dom';

const NotificationPortal = ({ notification, onClose }) => {
  const portalRoot = document.getElementById('notification-root');
  if (!portalRoot || !notification) return null;

  return ReactDOM.createPortal(
    <div className={`fixed top-4 right-4 p-4 rounded shadow-lg ${
      notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
    } text-white`}>
      {notification.message}
      <button onClick={onClose} className="ml-2 text-sm underline">Fermer</button>
    </div>,
    portalRoot
  );
};

export default NotificationPortal;
