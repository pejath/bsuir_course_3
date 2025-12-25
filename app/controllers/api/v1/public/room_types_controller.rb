class Api::V1::Public::RoomTypesController < ApplicationController
  skip_before_action :authenticate_user_from_token!

  def index
    @room_types = RoomType.all
    render json: @room_types
  end

  def show
    @room_type = RoomType.find(params[:id])
    render json: @room_type
  end
end
