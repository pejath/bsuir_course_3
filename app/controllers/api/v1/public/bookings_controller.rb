class Api::V1::Public::BookingsController < ApplicationController
  skip_before_action :authenticate_user_from_token!

  def create
    @guest = Guest.find_or_create_by(email: guest_params[:email]) do |guest|
      guest.first_name = guest_params[:first_name]
      guest.last_name = guest_params[:last_name]
      guest.phone = guest_params[:phone]
      guest.country = guest_params[:country]
    end

    if @guest.persisted?
      @guest.update(guest_params.except(:email))
    end

    unless @guest.valid?
      render json: { errors: @guest.errors.full_messages }, status: :unprocessable_entity
      return
    end

    @booking = Booking.new(booking_params)
    @booking.guest = @guest
    @booking.user = User.find_by(role: :manager) || User.first
    @booking.status = :pending

    if @booking.save
      render json: {
        booking: @booking.as_json(include: { room: { include: :room_type }, guest: {} }),
        message: 'Booking created successfully. We will contact you soon to confirm.'
      }, status: :created
    else
      render json: { errors: @booking.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def show
    @booking = Booking.includes(:guest, room: :room_type).find_by(
      id: params[:id],
      guest: { email: params[:email] }
    )

    if @booking
      render json: @booking, include: { room: { include: :room_type }, guest: {} }
    else
      render json: { error: 'Booking not found' }, status: :not_found
    end
  end

  private

  def guest_params
    params.require(:guest).permit(:first_name, :last_name, :email, :phone, :country, :notes)
  end

  def booking_params
    params.require(:booking).permit(:room_id, :check_in_date, :check_out_date, :number_of_guests, :notes)
  end
end
