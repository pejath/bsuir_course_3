class AnalyticsPolicy < ApplicationPolicy
  def index?
    user.analytics? || user.admin?
  end

  def dashboard?
    user.analytics? || user.admin?
  end

  def occupancy_rate?
    user.analytics? || user.admin?
  end

  def revenue_report?
    user.analytics? || user.admin?
  end

  def export_pdf?
    user.analytics? || user.admin?
  end

  def export_excel?
    user.analytics? || user.admin?
  end

  def room_statistics?
    user.analytics? || user.admin?
  end

  def revenue_trend?
    user.analytics? || user.admin?
  end

  def bookings_trend?
    user.analytics? || user.admin?
  end

  def occupancy_trend?
    user.analytics? || user.admin?
  end

  def lead_time_stats?
    user.analytics? || user.admin?
  end

  def top_room_types?
    user.analytics? || user.admin?
  end

  def guest_countries?
    user.analytics? || user.admin?
  end

  def services_analytics?
    user.analytics? || user.admin?
  end

  class Scope
    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      scope.all
    end

    private

    attr_reader :user, :scope
  end
end
