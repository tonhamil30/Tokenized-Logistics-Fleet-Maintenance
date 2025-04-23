;; Maintenance Scheduling Contract
;; Manages service based on mileage

;; Maintenance schedule data structure
(define-map maintenance-schedules
  { vehicle-id: uint }
  {
    last-maintenance-mileage: uint,
    maintenance-interval: uint,
    next-maintenance-mileage: uint,
    last-maintenance-date: uint
  }
)

;; Maintenance types
(define-map maintenance-types
  { type-id: uint }
  {
    name: (string-utf8 50),
    description: (string-utf8 100),
    recommended-interval: uint
  }
)

;; Initialize maintenance types
(define-data-var last-type-id uint u0)

;; Set up a maintenance schedule for a vehicle
(define-public (set-maintenance-schedule
    (vehicle-id uint)
    (current-mileage uint)
    (maintenance-interval uint))
  (let
    (
      (next-maintenance (+ current-mileage maintenance-interval))
    )
    (map-set maintenance-schedules
      { vehicle-id: vehicle-id }
      {
        last-maintenance-mileage: current-mileage,
        maintenance-interval: maintenance-interval,
        next-maintenance-mileage: next-maintenance,
        last-maintenance-date: block-height
      }
    )
    (ok true)
  )
)

;; Update vehicle mileage and check if maintenance is needed
(define-public (update-mileage (vehicle-id uint) (new-mileage uint))
  (let
    (
      (schedule (unwrap! (map-get? maintenance-schedules { vehicle-id: vehicle-id }) (err u1)))
      (next-maintenance (get next-maintenance-mileage schedule))
    )
    ;; Update the schedule with new mileage
    (map-set maintenance-schedules
      { vehicle-id: vehicle-id }
      (merge schedule {
        next-maintenance-mileage: (+ (get last-maintenance-mileage schedule) (get maintenance-interval schedule))
      })
    )

    ;; Return whether maintenance is needed
    (ok (>= new-mileage next-maintenance))
  )
)

;; Record completed maintenance
(define-public (record-maintenance (vehicle-id uint) (current-mileage uint))
  (let
    (
      (schedule (unwrap! (map-get? maintenance-schedules { vehicle-id: vehicle-id }) (err u1)))
      (next-maintenance (+ current-mileage (get maintenance-interval schedule)))
    )
    (map-set maintenance-schedules
      { vehicle-id: vehicle-id }
      {
        last-maintenance-mileage: current-mileage,
        maintenance-interval: (get maintenance-interval schedule),
        next-maintenance-mileage: next-maintenance,
        last-maintenance-date: block-height
      }
    )
    (ok true)
  )
)

;; Get maintenance schedule for a vehicle
(define-read-only (get-maintenance-schedule (vehicle-id uint))
  (map-get? maintenance-schedules { vehicle-id: vehicle-id })
)

;; Check if maintenance is due
(define-read-only (is-maintenance-due (vehicle-id uint) (current-mileage uint))
  (let
    (
      (schedule (default-to
        {
          last-maintenance-mileage: u0,
          maintenance-interval: u0,
          next-maintenance-mileage: u0,
          last-maintenance-date: u0
        }
        (map-get? maintenance-schedules { vehicle-id: vehicle-id })))
    )
    (>= current-mileage (get next-maintenance-mileage schedule))
  )
)

;; Add a new maintenance type
(define-public (add-maintenance-type
    (name (string-utf8 50))
    (description (string-utf8 100))
    (recommended-interval uint))
  (let
    (
      (new-id (+ (var-get last-type-id) u1))
    )
    (var-set last-type-id new-id)

    (map-set maintenance-types
      { type-id: new-id }
      {
        name: name,
        description: description,
        recommended-interval: recommended-interval
      }
    )

    (ok new-id)
  )
)

;; Get maintenance type details
(define-read-only (get-maintenance-type (type-id uint))
  (map-get? maintenance-types { type-id: type-id })
)
