import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Badge, Table } from 'react-bootstrap'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api, makeRequest } from '../../services/api'
import { formatCurrency } from '../../constants/appConstants'
import { FaArrowLeft, FaPlus, FaSave } from 'react-icons/fa'

const AdminEventForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { axios } = useAuth()

  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    type: '',
    subType: '',
    imageUrl: '',
    isActive: true,
    isFeatured: false,
    packages: [],
    venues: [],
    servicesIncluded: [],
    tags: [],
    highlights: [],
    excludes: [],
    cancellationPolicy: '',
    termsAndConditions: ''
  })

  const [packageForm, setPackageForm] = useState({
    name: 'custom',
    displayName: '',
    description: '',
    price: '',
    discountedPrice: '',
    maxGuests: '',
    duration: '4 hours',
    isActive: true
  })

  const [venueForm, setVenueForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    capacity: '',
    price: '',
    amenities: '',
    parking: false
  })

  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    category: 'other'
  })

  useEffect(() => {
    if (isEdit) {
      fetchEvent()
    }
  }, [id])

  const fetchEvent = async () => {
    try {
      setFetchLoading(true)
      const response = await axios.get(`/admin/events/${id}`)
      const event = response.data.data
      setFormData({
        name: event.name || '',
        description: event.description || '',
        shortDescription: event.shortDescription || '',
        type: event.type || '',
        subType: event.subType || '',
        imageUrl: event.images?.[0]?.url || event.images?.[0] || '',
        isActive: event.isActive !== undefined ? event.isActive : true,
        isFeatured: event.isFeatured || false,
        packages: event.packages || [],
        venues: event.venues || [],
        servicesIncluded: event.servicesIncluded || [],
        tags: event.tags || [],
        highlights: event.highlights || [],
        excludes: event.excludes || [],
        cancellationPolicy: event.cancellationPolicy || '',
        termsAndConditions: event.termsAndConditions || ''
      })
      setError(null)
    } catch (error) {
      console.error('Error fetching event:', error)
      setError(error.response?.data?.message || 'Failed to load event')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked, bool } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const addPackage = () => {
    if (!packageForm.displayName || !packageForm.price) {
      alert('Please fill in package name and price')
      return
    }

    const newPackage = {
      name: packageForm.name,
      displayName: packageForm.displayName,
      description: packageForm.description,
      price: parseFloat(packageForm.price) || 0,
      discountedPrice: packageForm.discountedPrice ? parseFloat(packageForm.discountedPrice) : undefined,
      maxGuests: packageForm.maxGuests ? parseInt(packageForm.maxGuests) : undefined,
      duration: packageForm.duration,
      isActive: packageForm.isActive,
      includedServices: [],
      features: []
    }

    setFormData(prev => ({
      ...prev,
      packages: [...prev.packages, newPackage]
    }))

    setPackageForm({
      name: 'custom',
      displayName: '',
      description: '',
      price: '',
      discountedPrice: '',
      maxGuests: '',
      duration: '4 hours',
      isActive: true
    })
  }

  const removePackage = (index) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index)
    }))
  }

  const addVenue = () => {
    if (!venueForm.name || !venueForm.city || !venueForm.address || !venueForm.capacity || !venueForm.price) {
      alert('Please fill in all required venue fields')
      return
    }

    const newVenue = {
      name: venueForm.name,
      address: venueForm.address,
      city: venueForm.city,
      state: venueForm.state,
      country: venueForm.country,
      pincode: venueForm.pincode,
      capacity: {
        min: 0,
        max: parseInt(venueForm.capacity)
      },
      price: parseFloat(venueForm.price) || 0,
      amenities: venueForm.amenities ? venueForm.amenities.split(',').map(a => a.trim()) : [],
      parking: venueForm.parking,
      isActive: true
    }

    setFormData(prev => ({
      ...prev,
      venues: [...prev.venues, newVenue]
    }))

    setVenueForm({
      name: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      capacity: '',
      price: '',
      amenities: '',
      parking: false
    })
  }

  const removeVenue = (index) => {
    setFormData(prev => ({
      ...prev,
      venues: prev.venues.filter((_, i) => i !== index)
    }))
  }

  const addService = () => {
    if (!serviceForm.name) {
      alert('Please enter a service name')
      return
    }

    const newService = {
      name: serviceForm.name,
      description: serviceForm.description,
      category: serviceForm.category
    }

    setFormData(prev => ({
      ...prev,
      servicesIncluded: [...prev.servicesIncluded, newService]
    }))

    setServiceForm({
      name: '',
      description: '',
      category: 'other'
    })
  }

  const removeService = (index) => {
    setFormData(prev => ({
      ...prev,
      servicesIncluded: prev.servicesIncluded.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (!formData.name.trim() || !formData.type || !formData.description.trim()) {
        throw new Error('Please fill event name, type, and description.')
      }

      if (formData.packages.length === 0) {
        throw new Error('Please add at least one package with pricing before saving the event.')
      }

      if (formData.venues.length === 0) {
        throw new Error('Please add at least one venue before saving the event.')
      }

      const payload = {
        ...formData,
        images: formData.imageUrl.trim()
          ? [{
              url: formData.imageUrl.trim(),
              caption: formData.name.trim(),
              isPrimary: true
            }]
          : [],
        packages: formData.packages.map(p => ({
          ...p,
          price: Number(p.price),
          discountedPrice: p.discountedPrice ? Number(p.discountedPrice) : undefined,
          maxGuests: p.maxGuests ? Number(p.maxGuests) : undefined
        })),
        venues: formData.venues.map(v => ({
          ...v,
          capacity: {
            min: 0,
            max: Number(v.capacity.max || v.capacity)
          },
          price: Number(v.price)
        }))
      }

      delete payload.imageUrl

      if (isEdit) {
        await makeRequest(api.updateEvent(id, payload))
      } else {
        await makeRequest(api.createEvent(payload))
      }

      setSuccess(isEdit ? 'Event updated successfully!' : 'Event created successfully!')

      setTimeout(() => {
        navigate('/admin/events')
      }, 1500)
    } catch (error) {
      console.error('Error saving event:', error)
      setError(error.response?.data?.message || error.message || 'Failed to save event')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <Link to="/admin/events" className="btn btn-outline-secondary mb-3">
          <FaArrowLeft className="me-2" /> Back to Events
        </Link>

        <h2 className="page-title mb-0">
          {isEdit ? 'Edit Event' : 'Add New Event'}
        </h2>
        <p className="text-muted mb-0">
          {isEdit ? 'Update event details and configuration' : 'Create a new event package with venues and services'}
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <Card.Header>Basic Information</Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Event Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Wedding Package, Corporate Event, etc."
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Event Type *</Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="wedding">Wedding</option>
                    <option value="birthday">Birthday</option>
                    <option value="corporate">Corporate</option>
                    <option value="party">Party</option>
                    <option value="religious">Religious</option>
                    <option value="college-fest">College Fest</option>
                    <option value="music-concert">Music Concert</option>
                    <option value="sports-event">Sports Event</option>
                    <option value="product-launch">Product Launch</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Short Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleInputChange}
                    placeholder="Brief description (max 300 characters)"
                    maxLength={300}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sub Type (Optional)</Form.Label>
                  <Form.Select
                    name="subType"
                    value={formData.subType}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Sub Type</option>
                    <optgroup label="Wedding">
                      <option value="sangeet">Sangeet</option>
                      <option value="mehndi">Mehndi</option>
                      <option value="haldi">Haldi</option>
                      <option value="reception">Reception</option>
                      <option value="marriage">Marriage</option>
                      <option value="engagement">Engagement</option>
                    </optgroup>
                    <optgroup label="Birthday">
                      <option value="kids">Kids</option>
                      <option value="teen">Teen</option>
                      <option value="adult">Adult</option>
                      <option value="milestone">Milestone</option>
                      <option value="surprise">Surprise</option>
                    </optgroup>
                    <optgroup label="Corporate">
                      <option value="conference">Conference</option>
                      <option value="team-building">Team Building</option>
                      <option value="product-launch">Product Launch</option>
                      <option value="annual-day">Annual Day</option>
                      <option value="seminar">Seminar</option>
                      <option value="workshop">Workshop</option>
                    </optgroup>
                    <optgroup label="Party">
                      <option value="anniversary">Anniversary</option>
                      <option value="housewarming">Housewarming</option>
                      <option value="retirement">Retirement</option>
                      <option value="baby-shower">Baby Shower</option>
                      <option value="gender-reveal">Gender Reveal</option>
                    </optgroup>
                    <optgroup label="Religious">
                      <option value="puja">Puja</option>
                      <option value="havan">Havan</option>
                      <option value="eid">Eid</option>
                      <option value="christmas">Christmas</option>
                      <option value="navratri">Navratri</option>
                      <option value="ganesh-chaturthi">Ganesh Chaturthi</option>
                    </optgroup>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Event Photo URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/event-cover.jpg"
                  />
                  <Form.Text className="text-muted">
                    Paste an image URL for the event cover photo.
                  </Form.Text>
                </Form.Group>
              </Col>
              {formData.imageUrl && (
                <Col md={12}>
                  <div className="border rounded p-3 bg-light">
                    <div className="small text-muted mb-2">Image Preview</div>
                    <img
                      src={formData.imageUrl}
                      alt="Event preview"
                      style={{ maxWidth: '220px', maxHeight: '160px', objectFit: 'cover' }}
                      className="rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                </Col>
              )}
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    placeholder="Detailed description of the event package..."
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Active"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Featured Event"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Packages Section */}
        <Card className="mb-4">
          <Card.Header>
            Packages & Pricing
          </Card.Header>
          <Card.Body>
            <Row className="g-3 mb-4">
              <Col md={3}>
                <Form.Select
                  value={packageForm.name}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="luxury">Luxury</option>
                  <option value="custom">Custom</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Control
                  placeholder="Display Name"
                  value={packageForm.displayName}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, displayName: e.target.value }))}
                />
              </Col>
              <Col md={2}>
                <Form.Control
                  type="number"
                  placeholder="Price"
                  value={packageForm.price}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, price: e.target.value }))}
                />
              </Col>
              <Col md={2}>
                <Form.Control
                  type="number"
                  placeholder="Discounted Price"
                  value={packageForm.discountedPrice}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, discountedPrice: e.target.value }))}
                />
              </Col>
              <Col md={2}>
                <Button variant="outline-primary" onClick={addPackage}>
                  <FaPlus className="me-1" /> Add Package
                </Button>
              </Col>
            </Row>

            {formData.packages.length > 0 && (
              <Table responsive hover size="sm">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Discounted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.packages.map((pkg, idx) => (
                    <tr key={idx}>
                      <td><Badge bg="secondary">{pkg.name}</Badge></td>
                      <td>{pkg.displayName}</td>
                      <td>{formatCurrency(pkg.price)}</td>
                      <td>{pkg.discountedPrice ? formatCurrency(pkg.discountedPrice) : '-'}</td>
                      <td>
                        <Button variant="link" size="sm" className="text-danger" onClick={() => removePackage(idx)}>
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>

        {/* Venues Section */}
        <Card className="mb-4">
          <Card.Header>
            Venues
          </Card.Header>
          <Card.Body>
            <Row className="g-3 mb-3">
              <Col md={3}>
                <Form.Control
                  placeholder="Venue Name"
                  value={venueForm.name}
                  onChange={(e) => setVenueForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </Col>
              <Col md={3}>
                <Form.Control
                  placeholder="Address"
                  value={venueForm.address}
                  onChange={(e) => setVenueForm(prev => ({ ...prev, address: e.target.value }))}
                />
              </Col>
              <Col md={2}>
                <Form.Control
                  placeholder="City"
                  value={venueForm.city}
                  onChange={(e) => setVenueForm(prev => ({ ...prev, city: e.target.value }))}
                />
              </Col>
              <Col md={2}>
                <Form.Control
                  placeholder="State"
                  value={venueForm.state}
                  onChange={(e) => setVenueForm(prev => ({ ...prev, state: e.target.value }))}
                />
              </Col>
              <Col md={2}>
                <Form.Control
                  type="number"
                  placeholder="Capacity"
                  value={venueForm.capacity}
                  onChange={(e) => setVenueForm(prev => ({ ...prev, capacity: e.target.value }))}
                />
              </Col>
            </Row>
            <Row className="g-3 mb-3">
              <Col md={3}>
                <Form.Control
                  type="number"
                  placeholder="Price"
                  value={venueForm.price}
                  onChange={(e) => setVenueForm(prev => ({ ...prev, price: e.target.value }))}
                />
              </Col>
              <Col md={3}>
                <Form.Control
                  placeholder="Amenities (comma separated)"
                  value={venueForm.amenities}
                  onChange={(e) => setVenueForm(prev => ({ ...prev, amenities: e.target.value }))}
                />
              </Col>
              <Col md={3}>
                <Form.Control
                  placeholder="Pincode"
                  value={venueForm.pincode}
                  onChange={(e) => setVenueForm(prev => ({ ...prev, pincode: e.target.value }))}
                />
              </Col>
              <Col md={3}>
                <Button variant="outline-primary" onClick={addVenue}>
                  <FaPlus className="me-1" /> Add Venue
                </Button>
              </Col>
            </Row>

            {formData.venues.length > 0 && (
              <Table responsive hover size="sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Capacity</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.venues.map((venue, idx) => (
                    <tr key={idx}>
                      <td>{venue.name}</td>
                      <td>{venue.city}, {venue.state}</td>
                      <td>{venue.capacity.max}</td>
                      <td>{formatCurrency(venue.price)}</td>
                      <td>
                        <Button variant="link" size="sm" className="text-danger" onClick={() => removeVenue(idx)}>
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>

        {/* Services Section */}
        <Card className="mb-4">
          <Card.Header>
            Services Included
          </Card.Header>
          <Card.Body>
            <Row className="g-3 mb-3">
              <Col md={4}>
                <Form.Control
                  placeholder="Service Name"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </Col>
              <Col md={4}>
                <Form.Select
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="venue">Venue</option>
                  <option value="catering">Catering</option>
                  <option value="decoration">Decoration</option>
                  <option value="photography">Photography</option>
                  <option value="music">Music</option>
                  <option value="lighting">Lighting</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="staffing">Staffing</option>
                  <option value="other">Other</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Button variant="outline-primary" onClick={addService}>
                  <FaPlus className="me-1" /> Add Service
                </Button>
              </Col>
            </Row>

            {formData.servicesIncluded.length > 0 && (
              <div className="d-flex flex-wrap gap-2">
                {formData.servicesIncluded.map((service, idx) => (
                  <Badge key={idx} bg="info" className="d-flex align-items-center" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                    {service.name} ({service.category})
                    <button
                      type="button"
                      className="btn-close btn-close-white ms-2"
                      style={{ fontSize: '0.7rem' }}
                      onClick={() => removeService(idx)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Additional Details */}
        <Card className="mb-4">
          <Card.Header>Additional Details</Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tags (comma separated)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.tags.join(', ')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                    }))}
                    placeholder="wedding, luxury, destination wedding..."
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Highlights (one per line)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.highlights.join('\n')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      highlights: e.target.value.split('\n').filter(h => h.trim())
                    }))}
                    placeholder="Premium decor&#10; gourmet catering&#10; live music"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cancellation Policy</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="cancellationPolicy"
                    value={formData.cancellationPolicy}
                    onChange={handleInputChange}
                    placeholder="Refund and cancellation terms..."
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Terms & Conditions</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="termsAndConditions"
                    value={formData.termsAndConditions}
                    onChange={handleInputChange}
                    placeholder="Terms and conditions..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Submit */}
        <div className="d-flex justify-content-between align-items-center">
          <Button variant="outline-secondary" as={Link} to="/admin/events">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            <FaSave className="me-2" />
            {loading ? <Spinner animation="border" size="sm" /> : null}
            {isEdit ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </Form>
    </Container>
  )
}

export default AdminEventForm
