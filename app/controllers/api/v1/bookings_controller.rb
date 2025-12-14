class Api::V1::BookingsController < Api::V1::BaseController
  before_action :set_booking, only: [:show, :update, :destroy, :cancel]

  def index
    @bookings = Booking.includes(:room, :guest, :user).all
    authorize @bookings
    render json: @bookings, include: [:room, :guest, :user]
  end

  def show
    authorize @booking
    render json: @booking, include: [:room, :guest, :user, :services, :payments]
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

  def booking_params
    params.require(:booking).permit(:room_id, :guest_id, :check_in_date, :check_out_date, :number_of_guests, :total_price, :status, :notes)
  end
end
