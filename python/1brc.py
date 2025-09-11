# This is a challenge for parsing 1 Billion rows of weather data


def parse_data() -> dict[str, list[float]]:
    city_weather_data: dict[str, list[float]] = {}

    with open("weather_stations.csv", "r", encoding="utf-8") as file:
        for line in file:
            weather_data = line.strip().split(";")
            if len(weather_data) > 2:
                raise ValueError(
                    f"Expected 2 items, but got {len(weather_data)} items."
                )

            city, temp_str = weather_data
            temp = float(temp_str)
            print(weather_data)
            if city in city_weather_data:
                city_data = city_weather_data[city]
                city_data[0] = min(city_data[0], temp)
                city_data[1] = max(city_data[1], temp)
                city_data[2] += temp
                city_data[3] += 1
            else:
                city_weather_data[city] = [temp, temp, temp, 1]

    return city_weather_data


print(parse_data())
