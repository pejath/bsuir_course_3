class Api::V1::SessionsController < Devise::SessionsController
  skip_before_action :verify_authenticity_token, raise: false
  skip_before_action :authenticate_user_from_token!, only: [:create]
  respond_to :json
  
  before_action :configure_sign_in_params, only: [:create]

  def create
    # Принудительно устанавливаем формат JSON
    request.format = :json
    
    self.resource = warden.authenticate!(auth_options)
    sign_in(resource_name, resource)
    yield resource if block_given?
    respond_with resource, location: after_sign_in_path_for(resource)
  rescue => e
    render json: { error: 'Invalid email or password' }, status: :unauthorized
  end

  private
  
  def configure_sign_in_params
    devise_parameter_sanitizer.permit(:sign_in, keys: [:email, :password])
  end

  def respond_with(resource, _opts = {})
    # Генерируем новый токен при каждом логине
    resource.regenerate_auth_token!
    
    render json: {
      token: resource.auth_token,
      user: {
        id: resource.id,
        email: resource.email,
        first_name: resource.first_name,
        last_name: resource.last_name,
        role: resource.role
      }
    }, status: :ok
  end

  def respond_to_on_destroy
    render json: { message: 'Logged out successfully' }, status: :ok
  end
end
