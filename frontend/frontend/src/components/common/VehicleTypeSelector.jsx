import { useMemo, useState } from 'react'
import {
  SMALL_VEHICLES,
  LARGE_VEHICLES,
  BUSINESS_LARGE_VEHICLES,
} from '../../constants/vehicleCatalog'
import './VehicleTypeSelector.css'

function VehicleItem({ item, isSelected, onToggle }) {
  return (
    <button
      type="button"
      className={`vehicle-selector__item ${isSelected ? 'is-selected' : ''}`}
      onClick={() => onToggle(item.label)}
    >
      <div className="vehicle-selector__icon" aria-hidden="true">{item.icon}</div>
      <div className="vehicle-selector__content">
        <div className="vehicle-selector__name">{item.label}</div>
        <div className="vehicle-selector__desc">{item.desc}</div>
      </div>
      <div className="vehicle-selector__check">✓</div>
    </button>
  )
}

function VehicleSection({ title, items, selectedValues, onToggle, badge }) {
  return (
    <div className="vehicle-selector__section">
      <div className="vehicle-selector__section-title">
        <span>{title}</span>
        {badge ? <span className="vehicle-selector__badge">{badge}</span> : null}
      </div>
      <div className="vehicle-selector__list">
        {items.map((item) => (
          <VehicleItem
            key={item.id}
            item={item}
            isSelected={selectedValues.includes(item.label)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  )
}

export default function VehicleTypeSelector({
  values = [],
  onChange,
  inputClassName = 'login-input',
  placeholder = '차량을 검색하거나 아래 목록에서 선택해 주세요',
}) {
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')

  const normalizedSearch = search.trim().toLowerCase()

  const filteredGroups = useMemo(() => {
    const filterItems = (items) =>
      items.filter((item) =>
        item.label.toLowerCase().includes(normalizedSearch)
        || item.desc.toLowerCase().includes(normalizedSearch),
      )

    return {
      all: [
        ...filterItems(SMALL_VEHICLES),
        ...filterItems(LARGE_VEHICLES),
        ...filterItems(BUSINESS_LARGE_VEHICLES),
      ],
      small: filterItems(SMALL_VEHICLES),
      large: filterItems(LARGE_VEHICLES),
      business: filterItems(BUSINESS_LARGE_VEHICLES),
    }
  }, [normalizedSearch])

  const handleToggle = (label) => {
    const nextValues = values.includes(label)
      ? values.filter((item) => item !== label)
      : [...values, label]
    onChange?.(nextValues)
  }

  const handleRemove = (label) => {
    onChange?.(values.filter((item) => item !== label))
  }

  const tabConfig = {
    all: {
      title: '전체',
      items: [...SMALL_VEHICLES, ...LARGE_VEHICLES, ...BUSINESS_LARGE_VEHICLES],
    },
    small: { title: '소형차량', items: SMALL_VEHICLES },
    large: { title: '대형차량', items: LARGE_VEHICLES },
    business: { title: '비지니스', items: BUSINESS_LARGE_VEHICLES, badge: '비즈니스' },
  }

  const currentItems = normalizedSearch ? filteredGroups[tab] : tabConfig[tab].items
  const hasCurrentItems = currentItems.length > 0

  return (
    <div className="vehicle-selector">
      <input
        type="text"
        className={`${inputClassName} vehicle-selector__search`}
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="vehicle-selector__tabs vehicle-selector__tabs--quad">
        <button
          type="button"
          className={`vehicle-selector__tab ${tab === 'all' ? 'is-active' : ''}`}
          onClick={() => setTab('all')}
        >
          전체
        </button>
        <button
          type="button"
          className={`vehicle-selector__tab ${tab === 'small' ? 'is-active' : ''}`}
          onClick={() => setTab('small')}
        >
          소형차량
        </button>
        <button
          type="button"
          className={`vehicle-selector__tab ${tab === 'large' ? 'is-active' : ''}`}
          onClick={() => setTab('large')}
        >
          대형차량
        </button>
        <button
          type="button"
          className={`vehicle-selector__tab ${tab === 'business' ? 'is-active' : ''}`}
          onClick={() => setTab('business')}
        >
          비지니스
        </button>
      </div>

      {values.length ? (
        <div className="vehicle-selector__selected">
          {values.map((item) => (
            <span key={item} className="vehicle-selector__chip">
              <span>{item}</span>
              <button
                type="button"
                className="vehicle-selector__chip-remove"
                onClick={() => handleRemove(item)}
                aria-label={`${item} 삭제`}
                title="삭제"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {hasCurrentItems ? (
        <VehicleSection
          title={tabConfig[tab].title}
          items={currentItems}
          selectedValues={values}
          onToggle={handleToggle}
          badge={tabConfig[tab].badge}
        />
      ) : (
        <div className="vehicle-selector__empty">검색 결과가 없습니다.</div>
      )}
    </div>
  )
}
