import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatCurrency } from '../../constants/appConstants';
import './Wishlist.css';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const resolveImageUrl = (value) => {
  if (!value) return '/assets/default-avatar.svg';
  if (typeof value === 'object') {
    return resolveImageUrl(value.url);
  }
  if (typeof value !== 'string') return '/assets/default-avatar.svg';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value;
  }
  if (value.startsWith('/assets/')) {
    return value;
  }
  if (value.startsWith('/')) {
    return `${API_BASE_URL}${value}`;
  }
  return `${API_BASE_URL}/${value.replace(/^\.?\//, '')}`;
};

const getWishlistImage = (item) => {
  const venueImage = item?.event?.venues?.find((venue) => Array.isArray(venue?.images) && venue.images.length > 0)?.images?.[0];

  return resolveImageUrl(
    item?.event?.images?.[0] || venueImage
  );
};

const Wishlist = () => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers/wishlist');
      setWishlist(res.data || []);
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (eventId) => {
    if (!window.confirm('Remove this event from your wishlist?')) return;

    try {
      await api.delete(`/customers/wishlist/${eventId}`);
      fetchWishlist();
    } catch (err) {
      alert('Failed to remove from wishlist');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading wishlist...</p>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>My Wishlist</h1>
          <p className="text-muted">Events you've saved for later</p>
        </div>
        <button className="btn btn-outline-primary" onClick={fetchWishlist}>
          <i className="bi bi-arrow-clockwise me-2"></i> Refresh
        </button>
      </div>

      {wishlist.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-heart display-4 text-muted"></i>
            <p className="mt-2">Your wishlist is empty</p>
            <p className="text-muted small">Save events you love to keep track of them</p>
            <Link to="/customer/events" className="btn btn-primary mt-2">
              Browse Events
            </Link>
          </div>
        </div>
      ) : (
        <div className="row">
          {wishlist.map(item => (
            <div key={item._id} className="col-md-6 col-lg-4 mb-4">
              <div className="card wishlist-card h-100">
                <img
                  src={getWishlistImage(item)}
                  className="card-img-top"
                  alt={item.event?.name}
                  style={{ height: '200px', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/images/default-event.jpg';
                  }}
                />
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="card-title">{item.event?.name}</h6>
                    <span className="badge bg-secondary text-capitalize">{item.event?.type}</span>
                  </div>
                  <p className="card-text text-muted small mb-2">
                    {item.event?.description?.substring(0, 80)}...
                  </p>
                  {item.event?.lowestPrice && (
                    <p className="mb-2">
                      <strong className="text-primary">{formatCurrency(item.event.lowestPrice)}</strong>
                      <small className="text-muted"> starting</small>
                    </p>
                  )}
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-muted small">
                      <i className="bi bi-geo-alt me-1"></i>
                      {item.event?.venues?.[0]?.city || 'Location N/A'}
                    </div>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeFromWishlist(item.event?._id)}
                    >
                      <i className="bi bi-heart-break"></i> Remove
                    </button>
                  </div>
                </div>
                <div className="card-footer bg-transparent">
                  <Link to={`/customer/events/${item.event?._id}`} className="btn btn-primary w-100">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
