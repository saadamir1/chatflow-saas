import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCityInput, UpdateCityInput } from './dto/graphql-inputs';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City) private readonly citiesRepository: Repository<City>,
  ) {}
  async create(createCityInput: CreateCityInput) {
    try {
      const city = this.citiesRepository.create(createCityInput);
      return await this.citiesRepository.save(city);
    } catch (err) {
      throw err;
    }
  }

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.citiesRepository.findAndCount({
      where: {},
      take: limit,
      skip: (page - 1) * limit,
      withDeleted: false, // don’t include soft-deleted records
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const city = await this.citiesRepository.findOne({ where: { id } });
    return city || null;
  }

  async update(id: number, updateCityInput: UpdateCityInput) {
    const city = await this.citiesRepository.findOne({ where: { id } });
    if (!city) {
      throw new NotFoundException(`City with id ${id} not found`);
    }
    Object.assign(city, updateCityInput);
    return await this.citiesRepository.save(city);
  }

  async remove(id: number) {
    const city = await this.citiesRepository.findOne({ where: { id } });
    if (!city) throw new NotFoundException(`City with id ${id} not found`);

    return await this.citiesRepository.softRemove(city); // soft delete
  }
}
