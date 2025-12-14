class Api::V1::RegistrationsController < Devise::RegistrationsController
  skip_before_action :verify_authenticity_token, raise: false
  skip_before_action :authenticate_user_from_token!
  respond_to :json

  private

  def respond_with(resource, _opts = {})
    if resource.persisted?
      render json: {
        token: resource.auth_token,
        user: {
          id: resource.id,
          email: resource.email,
          first_name: resource.first_name,
          last_name: resource.last_name,
          role: resource.role
        }
      }, status: :created
    else
      render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity
    end
  end
end
