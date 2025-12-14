class Api::V1::SessionsController < Devise::SessionsController
  skip_before_action :authenticate_user!, only: [:create]
  respond_to :json

  private

  def respond_with(resource, _opts = {})
    render json: {
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
    head :no_content
  end
end
