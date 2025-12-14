class Api::V1::ServicesController < Api::V1::BaseController
  before_action :set_service, only: [:show, :update, :destroy]

  def index
    @services = Service.all
    authorize @services
    render json: @services
  end

  def show
    authorize @service
    render json: @service
  end

  def create
    @service = Service.new(service_params)
    authorize @service

    if @service.save
      render json: @service, status: :created
    else
      render json: { errors: @service.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize @service

    if @service.update(service_params)
      render json: @service
    else
      render json: { errors: @service.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @service
    @service.destroy
    head :no_content
  end

  private

  def set_service
    @service = Service.find(params[:id])
  end

  def service_params
    params.require(:service).permit(:name, :description, :price, :active)
  end
end
