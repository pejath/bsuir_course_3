module TestHelpers
  def json_response
    JSON.parse(response.body)
  end

  def authenticate_user(user = nil)
    user ||= create(:user)
    auth_token = create(:auth_token, user: user)
    request.headers['Authorization'] = "Bearer #{auth_token.token}"
    auth_token
  end

  def authenticated_request(user, method, path, params: {})
    token = user.create_auth_token!(device_info: 'Test Device')
    headers = { 'Authorization' => "Bearer #{token.token}" }
    
    case method.downcase
    when 'get'
      get path, headers: headers, params: params
    when 'post'
      post path, headers: headers, params: params
    when 'put'
      put path, headers: headers, params: params
    when 'patch'
      patch path, headers: headers, params: params
    when 'delete'
      delete path, headers: headers, params: params
    end
    
    token
  end

  def create_admin_user
    create(:user, :admin, email: 'admin@example.com', password: 'admin123')
  end

  def create_manager_user
    create(:user, :manager, email: 'manager@example.com', password: 'manager123')
  end

  def create_user_with_role(role)
    create(:user, role: role)
  end

  def expect_authentication_error
    expect(response).to have_http_status(:unauthorized)
    expect(json_response['error']).to eq('Unauthorized')
  end

  def expect_success_response
    expect(response).to have_http_status(:ok)
  end

  def expect_forbidden
    expect(response).to have_http_status(:forbidden)
    expect(json_response['error']).to include('not authorized')
  end

  def expect_not_found
    expect(response).to have_http_status(:not_found)
  end

  def expect_unprocessable_entity(errors: nil)
    expect(response).to have_http_status(:unprocessable_entity)
    expect(json_response['errors']).to be_present if errors
  end
end
