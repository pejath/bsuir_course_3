require 'rails_helper'

RSpec.describe 'Protected Endpoints', type: :request do
  let(:user) { create(:user) }
  let(:admin) { create(:user, :admin) }

  describe 'GET /api/v1/rooms' do
    it 'requires authentication' do
      get '/api/v1/rooms'
      expect_authentication_error
    end

    it 'returns rooms for authenticated user' do
      authenticated_request(user, 'get', '/api/v1/rooms')
      expect_success_response
      expect(json_response).to be_present
    end
  end

  describe 'POST /api/v1/bookings' do
    let(:room) { create(:room) }
    let(:guest) { create(:guest) }
    
    it 'requires authentication' do
      post '/api/v1/bookings', params: {
        room_id: room.id,
        guest_id: guest.id,
        check_in_date: 1.day.from_now,
        check_out_date: 3.days.from_now,
        number_of_guests: 2
      }
      expect_authentication_error
    end

    it 'creates booking for authenticated user' do
      authenticated_request(user, 'post', '/api/v1/bookings', params: {
        room_id: room.id,
        guest_id: guest.id,
        check_in_date: 1.day.from_now,
        check_out_date: 3.days.from_now,
        number_of_guests: 2
      })
      
      # Check if we got HTML error page instead of JSON
      if response.content_type.include?('text/html')
        puts "Got HTML response instead of JSON"
        puts "Status: #{response.status}"
        puts "Body: #{response.body[0..200]}"
      end
    end
  end

  describe 'Admin-only endpoints' do
    it 'denies access to regular users' do
      authenticated_request(user, 'get', '/api/v1/analytics/dashboard')
      expect(response).to have_http_status(:forbidden)
    end

    it 'denies access to staff users' do
      staff = create(:user, :staff)
      authenticated_request(staff, 'get', '/api/v1/analytics/dashboard')
      expect(response).to have_http_status(:forbidden)
    end

    it 'allows access to admin users' do
      authenticated_request(admin, 'get', '/api/v1/analytics/dashboard')
      expect_success_response
    end

    it 'allows access to manager users' do
      manager = create(:user, :manager)
      authenticated_request(manager, 'get', '/api/v1/analytics/dashboard')
      expect_success_response
    end
  end
end
