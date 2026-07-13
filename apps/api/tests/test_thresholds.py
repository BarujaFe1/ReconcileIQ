from app.services.thresholds import normalize_text, sort_exceptions


def test_normalize_strips_diacritics():
    assert normalize_text("João Pedro") == normalize_text("Joao Pedro")


def test_sort_exceptions_helper():
    sorted_items = sort_exceptions(
        [
            {"severity": "low", "financial_impact": 10},
            {"severity": "high", "financial_impact": 50},
            {"severity": "high", "financial_impact": 90},
        ]
    )
    assert [i["financial_impact"] for i in sorted_items] == [90, 50, 10]
