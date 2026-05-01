import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatDate } from '../../constants/appConstants';
import './CustomerReviews.css';

const CustomerReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer/reviews');
      setReviews(res.data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className={`bi ${i < rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`}
      ></i>
    ));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your reviews...</p>
      </div>
    );
  }

  return (
    <div className="customer-reviews">
      <div className="mb-4">
        <h1>My Reviews</h1>
        <p className="text-muted">Your feedback and ratings for past events</p>
      </div>

      {reviews.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-star display-4 text-muted"></i>
            <p className="mt-2">No reviews yet</p>
            <p className="text-muted small">After completing an event, you can leave a review</p>
          </div>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map(review => (
            <div key={review._id} className="card review-card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="mb-1">{review.event?.name}</h6>
                    <small className="text-muted">{formatDate(review.createdAt)}</small>
                  </div>
                  <div className="d-flex align-items-center">
                    {renderStars(review.rating)}
                    <span className="ms-2 fw-bold">{review.rating}.0</span>
                  </div>
                </div>
                <p className="mb-2">{review.review}</p>
                {review.photos && review.photos.length > 0 && (
                  <div className="review-photos d-flex gap-2 mb-2">
                    {review.photos.map((photo, idx) => (
                      <img key={idx} src={photo} alt="Review" className="review-photo" />
                    ))}
                  </div>
                )}
                {review.event?.averageRating !== undefined && (
                  <div className="small text-muted">
                    <i className="bi bi-bar-chart"></i> Average rating: {review.event.averageRating.toFixed(1)} ({review.event.totalReviews || 0} reviews)
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerReviews;