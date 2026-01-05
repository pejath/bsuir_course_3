class Api::V1::Public::ServicesController < ApplicationController
  skip_before_action :authenticate_user_from_token!

  def index
    services = Service.where(active: true).order(:name)
    render json: services
  end
end
