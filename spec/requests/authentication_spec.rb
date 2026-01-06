require 'rails_helper'

RSpec.describe 'Authentication', type: :request do
  let(:user) { create(:user, password: 'password123') }

  describe 'POST /api/v1/users/sign_in' do
    context 'with valid credentials' do
      it 'authenticates the user and returns a token' do
        post '/api/v1/users/sign_in', params: {
          user: { email: user.email, password: 'password123' }
        }

        expect(response).to have_http_status(:ok)
        expect(json_response['token']).to be_present
        expect(json_response['user']['email']).to eq(user.email)
      end
    end
  end

  describe 'DELETE /api/v1/users/sign_out' do
    let(:auth_token) { create(:auth_token, user: user) }

    it 'logs out the user successfully' do
      delete '/api/v1/users/sign_out', headers: {
        'Authorization' => "Bearer #{auth_token.token}"
      }

      expect(response).to have_http_status(:ok)
      expect(json_response['message']).to eq('Logged out successfully')
    end
  end

  describe 'Token-based authentication' do
    context 'with valid token' do
      it 'allows access to protected endpoints' do
        authenticated_request(user, 'get', '/api/v1/rooms')
        expect_success_response
      end
    end

    context 'with expired token' do
      let(:expired_token) { create(:auth_token, user: user, expires_at: 1.day.ago) }

      it 'returns unauthorized error' do
        get '/api/v1/rooms', headers: {
          'Authorization' => "Bearer #{expired_token.token}"
        }

        expect_authentication_error
      end
    end

    context 'with invalid token' do
      it 'returns unauthorized error' do
        get '/api/v1/rooms', headers: {
          'Authorization' => 'Bearer invalid_token'
        }

        expect_authentication_error
      end
    end

    context 'without token' do
      it 'returns unauthorized error' do
        get '/api/v1/rooms'
        expect_authentication_error
      end
    end
  end

  describe 'Multiple concurrent sessions' do
    it 'allows multiple active tokens for the same user' do
      token1 = user.create_auth_token!(device_info: 'Device 1')
      token2 = user.create_auth_token!(device_info: 'Device 2')

      expect(AuthToken.where(user: user).count).to eq(2)
      expect(token1.token).not_to eq(token2.token)
    end

    it 'logging out from one session does not affect others' do
      token1 = user.create_auth_token!(device_info: 'Device 1')
      token2 = user.create_auth_token!(device_info: 'Device 2')

      # Logout from device 1
      delete '/api/v1/users/sign_out', headers: {
        'Authorization' => "Bearer #{token1.token}"
      }

      # Device 2 should still work
      get '/api/v1/rooms', headers: {
        'Authorization' => "Bearer #{token2.token}"
      }
      expect_success_response

      # Device 1 should not work
      get '/api/v1/rooms', headers: {
        'Authorization' => "Bearer #{token1.token}"
      }
    end
  end
end
