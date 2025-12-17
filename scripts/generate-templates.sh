#!/bin/bash
# Template Image Generation Script
# Generates AI food photos using curl calls to the API
#
# Usage: cd /Users/lexnaweiming/Test/marketing-heymag && ./scripts/generate-templates.sh

cd /Users/lexnaweiming/Test/marketing-heymag

API_URL="https://marketing.heymag.app/api/ai/generate"
OUTPUT_DIR="./data/generated-templates"
DELAY=5  # seconds between requests

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     TEMPLATE IMAGE GENERATION                                 ║"
echo "║     Gemini 3 Pro Image + Real-ESRGAN 2x                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "API URL: $API_URL"
echo "Output: $OUTPUT_DIR"
echo "Started: $(date)"
echo ""

# Function to generate an image
generate_image() {
    local category=$1
    local index=$2
    local prompt=$3

    echo "[$category] Generating #$index: ${prompt:0:50}..."

    local result=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{\"category\": \"$category\", \"customPrompt\": \"Generate this specific food item: $prompt. Make it absolutely stunning.\"}" \
        --max-time 180)

    # Check if we got a valid JSON response
    if [ -z "$result" ]; then
        echo "  ✗ Failed: Empty response"
        return 1
    fi

    # Check for success field
    local success=$(echo "$result" | jq -r '.success // false')
    local imageId=$(echo "$result" | jq -r '.images.imageId // empty')

    if [ "$success" = "true" ] && [ -n "$imageId" ] && [ "$imageId" != "null" ]; then
        echo "  ✓ Success: $imageId"
        echo "$result" > "$OUTPUT_DIR/${category}_${index}.json"
        return 0
    else
        local error=$(echo "$result" | jq -r '.error // .message // "Unknown error"')
        echo "  ✗ Failed: $error"
        return 1
    fi
}

# Track stats
total=0
success=0

# ═══════════════════════════════════════════════════════════════════════════
# DELIVERY & TAKEOUT (8 images)
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "DELIVERY & TAKEOUT (8 images)"
echo "════════════════════════════════════════════════════════════════"

items=(
    "Fresh poke bowl with salmon, avocado, edamame, sesame"
    "Colorful acai bowl with granola, fresh berries, banana"
    "Asian grain bowl with teriyaki chicken, brown rice"
    "Mediterranean bowl with hummus, falafel, tahini"
    "Sushi burrito with fresh tuna and spicy mayo"
    "Buddha bowl with quinoa, roasted chickpeas, tahini"
    "Thai basil chicken rice bowl with fried egg"
    "Korean bibimbap with beef and gochujang"
)

for i in "${!items[@]}"; do
    generate_image "delivery" "$i" "${items[$i]}" && ((success++))
    ((total++))
    [ $i -lt $((${#items[@]}-1)) ] && sleep $DELAY
done

# ═══════════════════════════════════════════════════════════════════════════
# RESTAURANT (8 images)
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "RESTAURANT (8 images)"
echo "════════════════════════════════════════════════════════════════"

items=(
    "Pan-seared salmon with crispy skin and lemon butter"
    "Avocado toast with perfectly poached egg"
    "Wagyu beef burger with truffle aioli"
    "Grilled lobster tail with garlic herb butter"
    "Creamy mushroom risotto with truffle oil"
    "Herb-crusted lamb chops with mint sauce"
    "Roasted duck breast with orange glaze"
    "Seafood linguine with clams in white wine"
)

for i in "${!items[@]}"; do
    generate_image "restaurant" "$i" "${items[$i]}" && ((success++))
    ((total++))
    [ $i -lt $((${#items[@]}-1)) ] && sleep $DELAY
done

# ═══════════════════════════════════════════════════════════════════════════
# FINE DINING (8 images)
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "FINE DINING (8 images)"
echo "════════════════════════════════════════════════════════════════"

items=(
    "Seared duck breast with cherry reduction"
    "Beef tenderloin with foie gras and truffle"
    "Pan-seared scallop with cauliflower puree"
    "Venison loin with blackberry jus"
    "Butter-poached lobster with champagne foam"
    "Wagyu tataki with ponzu and shiso"
    "Turbot fillet with saffron beurre blanc"
    "Deconstructed tiramisu with espresso gel"
)

for i in "${!items[@]}"; do
    generate_image "fine-dining" "$i" "${items[$i]}" && ((success++))
    ((total++))
    [ $i -lt $((${#items[@]}-1)) ] && sleep $DELAY
done

# ═══════════════════════════════════════════════════════════════════════════
# CAFE & COFFEE (8 images)
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "CAFE & COFFEE (8 images)"
echo "════════════════════════════════════════════════════════════════"

items=(
    "Artisan butter croissant with flaky layers"
    "Matcha latte with leaf foam art"
    "French chocolate eclair with glossy glaze"
    "Avocado toast on sourdough bread"
    "Mixed berry tart with vanilla custard"
    "Warm cinnamon roll with cream cheese frosting"
    "Perfect cappuccino with rosetta art"
    "Eggs Benedict with hollandaise sauce"
)

for i in "${!items[@]}"; do
    generate_image "cafe" "$i" "${items[$i]}" && ((success++))
    ((total++))
    [ $i -lt $((${#items[@]}-1)) ] && sleep $DELAY
done

# ═══════════════════════════════════════════════════════════════════════════
# CHRISTMAS (4 images)
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "CHRISTMAS (4 images)"
echo "════════════════════════════════════════════════════════════════"

items=(
    "Glazed Christmas ham with honey and cloves"
    "Decorated gingerbread cookies with icing"
    "Yule log cake with chocolate ganache"
    "Festive hot chocolate with whipped cream"
)

for i in "${!items[@]}"; do
    generate_image "christmas" "$i" "${items[$i]}" && ((success++))
    ((total++))
    [ $i -lt $((${#items[@]}-1)) ] && sleep $DELAY
done

# ═══════════════════════════════════════════════════════════════════════════
# CHINESE NEW YEAR (4 images)
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "CHINESE NEW YEAR (4 images)"
echo "════════════════════════════════════════════════════════════════"

items=(
    "Yu Sheng prosperity toss salad with salmon"
    "Steamed whole fish with ginger and scallion"
    "Golden pineapple tarts on red plate"
    "Chinese dumplings in lucky pattern"
)

for i in "${!items[@]}"; do
    generate_image "chinese-new-year" "$i" "${items[$i]}" && ((success++))
    ((total++))
    [ $i -lt $((${#items[@]}-1)) ] && sleep $DELAY
done

# ═══════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    GENERATION COMPLETE                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Total: $success/$total images generated"
echo "Finished: $(date)"
echo ""
echo "Results saved to: $OUTPUT_DIR"
echo ""

# List generated files
echo "Generated files:"
ls -la "$OUTPUT_DIR"/*.json 2>/dev/null | wc -l
ls "$OUTPUT_DIR"/*.json 2>/dev/null
