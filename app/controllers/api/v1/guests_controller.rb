class Api::V1::GuestsController < Api::V1::BaseController
  before_action :set_guest, only: [ :show, :update, :destroy ]

  def index
    authorize Guest
    guests = Guest.all

    if params[:search].present?
      search_term = "%#{params[:search]}%"
      guests = guests.where(
        "first_name ILIKE ? OR last_name ILIKE ? OR email ILIKE ? OR phone ILIKE ? OR passport_number ILIKE ?",
        search_term, search_term, search_term, search_term, search_term
      )
    end

    guests = guests.where(country: params[:country]) if params[:country].present?

    guests = guests.order(created_at: :desc)
    pagy, @guests = pagy(guests, limit: params[:limit] || 50)
    render json: {
      data: @guests,
      pagination: pagy_metadata(pagy)
    }
  end

  def show
    authorize @guest
    render json: @guest
  end

  def create
    @guest = Guest.new(guest_params)
    authorize @guest

    if @guest.save
      render json: @guest, status: :created
    else
      render json: { errors: @guest.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize @guest

    if @guest.update(guest_params)
      render json: @guest
    else
      render json: { errors: @guest.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @guest
    @guest.destroy
    head :no_content
  end

  private

  def set_guest
    @guest = Guest.find(params[:id])
  end

  def guest_params
    params.require(:guest).permit(:first_name, :last_name, :email, :phone, :passport_number, :date_of_birth, :country, :notes)
  end
end
