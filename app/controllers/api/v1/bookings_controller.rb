class Api::V1::BookingsController < Api::V1::BaseController
  before_action :set_booking, only: [:update, :destroy, :cancel]
  before_action :set_booking_with_details, only: [:show]

  def index
    authorize Booking
    pagy, @bookings = pagy(Booking.includes(:guest, :user, room: :room_type).order(check_in_date: :desc), limit: params[:limit] || 50)
    render json: {
      data: @bookings.as_json(include: { room: { include: :room_type }, guest: {}, user: {} }),
      pagination: pagy_metadata(pagy)
    }
  end

  def show
    authorize @booking
    render json: @booking, include: { room: { include: :room_type }, guest: {}, user: {}, services: {}, payments: {} }
  end

  def create
    @booking = Booking.new(booking_params)
    @booking.user = current_user
    authorize @booking

    if @booking.save
      render json: @booking, status: :created
    else
      render json: { errors: @booking.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize @booking

    if @booking.update(booking_params)
      render json: @booking
    else
      render json: { errors: @booking.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @booking
    @booking.destroy
    head :no_content
  end

  def cancel
    authorize @booking, :cancel?
    
    if @booking.update(status: :cancelled)
      render json: @booking
    else
      render json: { errors: @booking.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_booking
    @booking = Booking.find(params[:id])
  end

  def set_booking_with_details
    @booking = Booking.includes(:guest, :user, :services, :payments, room: :room_type).find(params[:id])
  end

  def booking_params
    params.require(:booking).permit(:room_id, :guest_id, :check_in_date, :check_out_date, :number_of_guests, :total_price, :status, :notes)
  end
end
